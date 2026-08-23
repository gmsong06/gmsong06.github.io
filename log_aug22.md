## August 22, 2026

I spent a lot of time verifying YOLO today. The symptom was that detection only worked when the tomato was already pretty close, but the arm wants to work farther out than that. My first guess was that this was a dataset problem, like Laboro was trained on images where the tomatoes took up way more of the frame than mine do, so the model just never learned what a tiny cherry tomato looks like. Turns out that was wrong, but it took a lot of measuring to prove it.

### Measuring the two frames

I grabbed two rqt screenshots, one at the distance the arm actually wants to work at and one at the distance where detection starts working.

![Tomato too far to detect](../assets/projects/tomato/too_far.png)
![Tomato close enough to detect](../assets/projects/tomato/close_enough.png)

The rqt image panes render at 1.408x, so I had to divide out the display scale to get real sensor pixels:

| | tomato diameter | estimated Z |
|---|---|---|
| too far | 15.6 px | ~82 cm |
| close enough | 30.5 px | ~42 cm |

I got the depth from $Z = fD/d$ using the raw camera matrix $f = 709.14$ and $D = 18$ mm, which is the fruit size I have in `tomato_world.sdf` (8-10 mm radius). So detection was basically only working in the near half of my 35-85 cm workspace, which matches what I was seeing.

### Was it the training data?

First I pulled the training args straight out of the `.pt` checkpoints. All three were trained at `imgsz=640`, 300 epochs, Ultralytics defaults, so `scale=0.5`, `mosaic=1.0`, `multi_scale=0.0`. Mosaic quarters instances, so the training set already covered a pretty wide range of apparent sizes. That already made me suspicious of my own hypothesis.

Then I ran the actual test. Same two frames, `yolo11s_6`, conf floor dropped to 0.05 so I could see what the model was really thinking:

```
                 imgsz=640   imgsz=960   imgsz=1280
near (30.5px)      0.86        0.91         0.88
far  (15.6px)      0.42        0.68         0.68
```

So no, it is not the training data, and there are two reasons I'm confident:

1. The exact same model nails the exact same tomato at 0.86-0.91 when it's 30 px. It knows perfectly well what my tomatoes look like. Nothing about appearance, lighting, or the foliage background is confusing it.
2. Upscaling recovers the far case with no retraining at all. This is the important one. **Upscaling adds zero new information**, it only adds grid cells. If the model genuinely had never learned small-tomato features, bumping to 960 could not possibly lift 0.42 to 0.68. But it does.

What's actually happening is that YOLO11's finest detection head is P3 at stride 8. At `imgsz=640` on a 640-wide frame, a 15.6 px tomato spans about **2 grid cells**, which is right at the floor of what an anchor-free head can localize. At 960 the same tomato maps to ~23 px, so ~3 cells. That's the whole difference.

I also ruled out focus, since I was worried the far frame was just blurry. Laplacian variance on the tomato patch was 306 far vs 354 near. Both sharp, so that's not it.

### What works: imgsz 960

This is the headline. Going from 640 to 960 takes the far edge of the workspace from 0.42 to 0.68. My `yolo_conf` is 0.4, so 0.42 was literally sitting on the threshold, which explains why detection was flickery instead of cleanly failing. At 960 the true detection is 0.68 and the best false positive is 0.20, so those are nicely separated and I can drop conf to 0.30 for margin. I should not do that at 1280 though, because junk detections start reaching 0.32 there.

Cost is roughly 2.2 s/frame vs 1.0 s at 640. Painful but I'd rather have detections.

### yolo11s_6 beats yolo11m_6, which I did not expect

The medium model scored **0.33 on the near tomato at imgsz 640**. That's below my 0.4 threshold, meaning `yolo11m_6` would miss even the easy close-up case. It never got above 0.14 on the far tomato at any size. Bigger model is straight up losing here, and it's also the slower one, so staying on `yolo11s_6`.

### The 448 default has been sabotaging me

`stereo.launch.py` defaults `yolo_imgsz` to 448 while `robot.launch.py` uses 640. At 448 the far tomato scores 0.08-0.09, so it's just gone. If I captured any of my test frames through the stereo launch file, that alone explains the misses. Free fix, just make the defaults agree.

### Config C bookkeeping, and a row that was lying to me

While filling in the config C column of my comparison table I found a few stale numbers. HFOV/VFOV compute to 42.49 / 24.67 deg, that part was fine. But:

- The depth range and the depth-per-disparity-pixel cells were computed with the **predicted** $f \cdot B = 79.47$ instead of the **measured** 83.0029. My own calibration comment says the crop-ratio prediction was 4.4% low, so I was propagating a number I'd already disproven.
- The depth-valid HFOV of 30.2 deg was left over from the old `[63, 191]` disparity window.

The worst one though: **the "tomato px" row uses a different tomato diameter in every single column.** Back-solving gives 35 mm for Current, 43.8 mm for A, and 49 mm for B. And none of them match my actual fruit, which is 16-20 mm. So the table was telling me I had ~50 px on target at 80 cm when the real number is ~18 px. That row was actively misleading me about which configs were viable, which is probably part of why I chased the dataset theory in the first place. Need to redo it at one honest diameter across all four columns.

### FOV, and a surprise

I simulated what config B would see by rescaling the frames by the focal ratio (525.44/823.15 = 0.638), so the tomato appears at B's smaller pixel size. B held basically level with C despite **1.57x fewer pixels on target**: 0.46/0.63/0.54 at the three imgsz values, versus C's 0.42/0.68/0.68.

The takeaway is that confidence saturates somewhere around 20 px, so C's extra pixels above that buy nothing. The knee is a lot lower than I assumed. Caveat that this is one frame with one unoccluded fruit and a simulation rather than a real capture, so I'm not fully trusting it yet.

### ROI (saving this for tomorrow)

Confirmed the IMX708 only has three sensor modes, so there's no intermediate one. But `rpicam-vid --roi` sets a digital crop and gives continuous FOV control. And it's not a hack, because the 1536x864 mode is exactly the centered 2/3 of the array (768/4608 = 0.167, 3072/4608 = 0.667), so ROI can reach the same sensor pixels the mode does.

I verified this on the actual hardware by capturing three frames:

```
modeC vs modeB_roi : mean|diff| = 13.38    <- same field
modeC vs modeB     : mean|diff| = 40.00    <- clearly different field
```

`--mode 2304:1296:10:P --roi 0.167,0.167,0.667,0.667` reproduces mode C's exact view, so ROI composes the way I expected. That means one mode plus one continuous knob covers the entire useful FOV range and I'd never touch `--mode` again.

The nice property is that at a fixed output width, **YOLO costs the same regardless of ROI**. Narrowing the ROI buys pixels on target for free, whereas raising output resolution buys the same pixels at quadratic cost. Something like ROI 0.85 would give me 32.5 deg VFOV instead of 24.7 while costing less overall than C does now.

Not doing it today though. Every ROI value needs its own calibration set, and `camera_node.py` doesn't even pass `--roi` yet, so that's tomorrow's problem.

### Next steps

1. Bump `yolo_imgsz` to 960 and make the stereo/robot launch defaults agree
2. Drop `yolo_conf` to 0.30
3. Redo the tomato px row at a real 18 mm diameter across all configs
4. Plumb `--roi` through `camera_node.py` and the launch files, sweep it, pick a value, then calibrate set D
