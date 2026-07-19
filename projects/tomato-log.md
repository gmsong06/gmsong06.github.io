<!--
Add a new log entry with:

## Month Day, Year

Write progress notes here. Multiple paragraphs are okay.

![Image caption](../assets/path/to/image.jpg)
![Video caption](../assets/path/to/video.mp4)

Inline math: $x = y + z$
Display math:
$$
x = y + z
$$
-->

## June 04, 2026

I worked on the tomato detection side of the project. I looked into possible datasets for training and testing, which included the [Laboro tomato dataset](https://www.kaggle.com/datasets/nexuswho/laboro-tomato), [Mendeley cherry tomato images](https://data.mendeley.com/datasets/ffgp73gfsr/1), and [RoboPheno RGB images](https://research.wur.nl/en/datasets/rob2pheno-annotated-tomato-image-dataset/). I only used the Laboro for training and the other two for testing.

The Laboro dataset has six classes:

1. `b_fully_ripened`
2. `b_half_ripened`
3. `b_green`
4. `l_fully_ripened`
5. `l_half_ripened`
6. `l_green`

The `b` and `l` are for big and little.

## June 05, 2026

Since my target application is autonomous cherry tomato harvesting, I planned to train the detector on Laboro and then evaluate it on the other two sets of cherry tomato images. I also decided to use YOLOv11s for object detection because it seemed to do the best when compared to smaller and larger models in terms of balancing accuracy with latency. So the final model configuration: YOLOv11s, object detection task, 640 × 640 input resolution, six classes, and outputs of bounding box, ripeness class, and confidence score.

I decided to use bounding boxes instead of instance segmentation. Segmentation would give more precise tomato boundaries, but lowk I wasn't about to spend multiple days annotating data for segmentation because Laboro doesn't come with it. Plus  tomatoes are often occluded by leaves, stems, calyx structures, and other tomatoes. Bounding boxes are simpler and still accurate enough for deciding which tomato to harvest. If it's an issue, it's future Ann's issue idc.

![Detection 1](../assets/projects/tomato/detection1.png)
![Detection 2](../assets/projects/tomato/detection2.png)
![Detection 3](../assets/projects/tomato/detection3.png)

## June 06, 2026

Today I worked on connecting tomato detection to harvesting decisions. I simplified the original six Laboro classes into three ripeness categories: fully_ripened, half_ripened, and green because idrc how big tomatos are, a tomatos a tomato lol.

I also started thinking about validation after YOLO detection. Since false positives could cause the robot to harvest the wrong thing, I added the idea of filtering weak bounding boxes before using them. I have two checks: a minimum area filter and a tomato color coverage filter. Very small detections would be rejected using a minimum bounding-box area threshold of 400 pixels, since these are likely caused by image noise, stems, or background artifacts.

I also wanna do an additional check for the tomato color because I lowk don't think I trust the model fully. It's detection is great, but half ripened vs ripened is a little iffy.

For the tomato color coverage check, I planned to crop each YOLO bounding box, convert it to HSV, classify pixels as red, orange, yellow, or green, and compute:

```
tomato_ratio = tomato-colored pixels / total pixels in bounding box
```

![Overlay 1](../assets/projects/tomato/overlay1.png)
![Overlay 2](../assets/projects/tomato/overlay2.png)
![Overlay 3](../assets/projects/tomato/overlay3.png)

I added a minimum warm-pixel requirement so that a few red pixels would not accidentally make the system classify a tomato as ripe. I also implemented the final decision fusion between YOLO and HSV. If YOLO and HSV agreed, the decision was straightforward. A fully ripe tomato would become fully_ripened_pickable, while half-ripe and green tomatoes would become not pickable. If YOLO and HSV disagreed, the system would act conservatively. For example, YOLO fully ripe but HSV half ripe would be treated as half_ripened_not_pickable.

After finalizing the harvesting policy for the tomato detection pipeline, the system would produce one of four final decisions:

- fully_ripened_pickable
- half_ripened_not_pickable
- green_not_pickable
- uncertain_not_pickable

![Pickability 1](../assets/projects/tomato/pickability_fully_ripe.jpg)
![Pickability 2](../assets/projects/tomato/pickability_half_ripe1.jpg)
![Pickability 3](../assets/projects/tomato/pickability_half_ripe2.jpg)
![Pickability 4](../assets/projects/tomato/pickability_green.jpg)

Only ```fully_ripened_pickable``` tomatoes would be considered valid harvesting targets. Everything else would be excluded from autonomous harvesting.

In general, the main design philosophy was to prioritize precision over recall. Harvesting an unripe tomato is irreversible, while missing a ripe tomato only delays harvesting until a later pass. Because of that, the system is quite conservative with deeming a tomato as pickable.

## June 07, 2026

So today I lowk had the realization that plain Python might not cut it for this project. I think I wanna try using ROS for this project, so I did a little research on the basics of ROS because I've never used it. Just did some reading of documentation on Nodes, Interfaces, Topics, Services, Actions, etc. It seems pretty intuitive. Like it seems like ROS nodes are just somewhere in between classes and subsystems.

## June 09, 2026

I went back to the perception pipeline today and worked on camera calibration. Originally we were gonna use an RGBD camera but those types of cameras are just slightlyyyyy way too expensive, so instead I'm going to build stereo vision with two Raspberry Pi Cameras.

The extent of my knowledge of cameras is from FRC limelight cameras, so this involved watching a lot of yt videos to teach myself calibration and how stereo vision works in general. I got monocular calibration working (I think?) with OpenCV. Image rectification is also working.

Here is my very scuffed camera mount.
![Original Camera Mount](../assets/projects/tomato/original_cam_mount.png)

## June 10, 2026

I did research on Semi-Global Matching (SGBM) today. It's supposedly more effective than regular Block Matching as a stereo matching algorithm. I first started by reading the [original paper](https://ieeexplore.ieee.org/abstract/document/1467526) for SGBM. It made no sense lol. But after reading some other articles and papers it made a little more sense!

## June 11, 2026

Ok so image rectification is actually really bad lol. Like really bad. Nothing aligns on the same horizontal line, so I don't think I should even attempt SGBM right now. I think something with my camera mount is causing issues because the weird thing with the mount is that if you close cover so it's snug, it puts pressure on the cameras where there shouldn't be pressure and it causes the feed to be really blurry.


## June 13, 2026
The first servo motor arrived. We are planning on using the STS3215 model.
![First Servo](../assets/projects/tomato/first_servo.png)


## June 15, 2026

I attempted running the motor with some pre-written code today. Uh so it didn't work. We actually think I mayyy have fried the motors. They're only able to move in really small incremeents idk. TBD, but I ordered another servo and I'm gonna keep my distance for now lol.

## June 20, 2026
So I actually didn'y fry the servo, I was just being dumb and didn't realize the encoder reads ticks. Since it's a 12 bit encoder, there's 4096 ticks in a revolution. After writing some conversion constants and reading some documentation on the different modes of the servo, I was able to get it to spin at a set velocity. I think next steps are getting it all implemented as ROS nodes.

## June 21, 2026
I worked a lot on the motor node today. Named it FeetechMotorNode and it'll basically be the node for the entire motor bus. The node is a publisher to ```joint_states``` where it just publishes the angle of the motors. It's also a subscripted to ```motor_target_velocities``` which in the future, other nodes will send velocities for the motor node to set the motor to. From a design standpoint, I want this to be the only node directly communicating with the hardware.

## June 22, 2026
I wrote the camera node today. The left and right camera will use the same node just with different parameters. It takes in camera_id, width, height, topic, and fps as of right now. It publishes raw images right now.

I also figured out what launch files do, so I wrote a launch file to launch the only two nodes I have right now lol.

## June 23, 2026
The robot arm design was completed today!

![Robot arm design](../assets/projects/tomato/robot_arm_design.png)
![Robot drawing](../assets/projects/tomato/robot_drawing.png)

I also set up a perception package today with one node named TomatoDetection that subscribes to the topic where the camera node publishes raw images (I haven't decided the topic names yet), publishes to ```/tomato_seen (Bool)```, ```/tomato_crop_image_raw (Image)```, and ```/tomato_yolo_ripeness```.

## June 24, 2026
Ok I switched up the design of the TomatoDetection Node. I added custom interface messages for detections, so I'm able to publish multiple tomatos that are detected. It only publishes to ```/tomato_detections``` now. The custom message basically has information on yolo ripeness and confidence and coordinates on where the tomato is in the raw image.

I got the three nodes communicating with each other. It doesn't look like much, but getting the publishers and subscriptions communicating properly was lowk non-trivial. Turn sound up for video.

![Detection Motor Spin](../assets/projects/tomato/detection_motor_spin.mov)

## June 25, 2026
I wanted to get teleop working for one motor. Teleop's kinda a strong word for this ik. I just made a node called KeyboardControlNode that publishes to ```motor_target_velocities```.

I also wrote a lot of servo helper scripts today in preparation for when the robot arm would be fully assembled.

```calibrate_motor```: calibrates one motor by taking the zero position, min, and max and then doing a homing offset so that the zero position is tick 2048 (half of 4096, which is one revolution)

```change_motor_id```: takes in an old motor id and then changes it to the desired new one. Servos likely all have the same default id, so it's important that they're differentiated.

```find_motor_ids```: scans for detectable servos

```jog_motor```: moves the chosen motor in increments. I think this'll just be used to test that we're able to communicate with the motor

```read_motors```: returns the current position of the motors

```set_operating_mode```: for moving between position and velocity mode

## June 26, 2026
We assembled the arm today and got basic teleop working. The little red attachment is a placeholder for the mechanism that we have yet to design for the end effector.

We calibrated the motors and set the zero position to the arm pointing straight up.

![Initial teleop](../assets/projects/tomato/initial_teleop.mov)

## June 27, 2026
In preparation for future imitation learning, I worked on a simple record and replay trajectory feature for the arm.

The goal was to make the robot repeat a motion that I physically demonstrated by hand, instead of having to manually command every joint position.

### Recording Mode
This turns torque off so it allows me to manually move the arm. I planned this as a ROS service call so torque can be turned on or off cleanly. The trajectory recorder node starts listening to the robot’s current joint positions. The motor node continuously reads encoder values from each Feetech servo and publishes them as ```JointState``` messages. The recorder subscribes to these joint states so it always knows the current position of each joint.

This creates a recorded trajectory made up of timestamped joint positions.

### Replay Mode

Replay mode loads the saved trajectory and turns motor torque back on. The replay node steps through the recorded joint positions in order and publishes them as target commands to the motor node.

The motor node then sends those target positions to the Feetech servos, causing the arm to repeat the demonstrated motion. This gives the robot a basic teach-and-repeat capability that can later be used for collecting imitation learning demonstrations. It also takes in a speed multiplier. The first video shows the recording and replaying process. The second video is the same trajectory, but at 2x speed with replay.

![Record and replay](../assets/projects/tomato/record_replay1.mov)

![Record and replay 2x speed](../assets/projects/tomato/record_replay2.mov)

## June 28, 2026
I built a custom dashboard for the arm today. I've also been using Foxglove, but I think it'd be nice to have some additinoal functionality. I wanted the ability to control joints and torque through dragging sliders and clicking a button.

![Dashboard](../assets/projects/tomato/dashboard.png)
![Dashboard demo](../assets/projects/tomato/dashboard_demo.mov)

## June 29, 2026
I worked on writing a robot description URDF file by describing the links and joints of the arm. It looks pretty good in rviz. Not sure how I'm gonna use the sim right now, but just having the description is pretty good for now.

![URDF RViz](../assets/projects/tomato/urdf_rviz.png)

## June 30, 2026
We got a new camera mount set up, so after a bit of a break from perception, I started working on stereo vision again. We got a new camera mount set up, so after a bit of a break from perception, I started working on stereo vision again. Having the cameras physically mounted made the problem feel a lot more tangible, because before this I had mostly been thinking about stereo vision in terms of calibration math and ROS topics or using a half broken camera case.

The first step was getting both cameras publishing properly in ROS. I set up the camera nodes so that each camera had its own parameters, including its own camera ID, topic name, frame ID, and calibration file. Instead of just publishing one ```/camera/image_raw``` topic, I started organizing the system around stereo topics like ```/stereo/left/image_raw``` and ```/stereo/right/image_raw```. This made the camera setup cleaner and closer to what ```stereo_image_proc``` (the ROS package I'm using for stereo) expects.

I also had to think through calibration again now that the cameras were mounted. Since the cameras are not hardware synchronized, I could not rely on perfectly simultaneous frames. I decided to first focus on getting monocular calibration for each camera individually, then use those results as the foundation for stereo calibration. The goal was to get each camera publishing images, as well as correct CameraInfo messages from its calibration YAML.

Oh also I'm using the asymmetric circles calibration pattern.

## July 01, 2026
Today I kept working on stereo calibration. After getting the two mounted cameras publishing as a stereo pair, I started trying to turn the camera setup into a usable stereo system.

The first issue was that stereo calibration is much more sensitive than monocular calibration. With monocular calibration, I only needed each camera to understand its own lens distortion and intrinsics. With stereo calibration, the two cameras also need a correct relationship to each other: their relative rotation, translation, and baseline.

Also the ROS ```camera_calibration``` node is lowk annoying because it takes photos at images it deems as different from other images but idk when it's gonna take a photo so I have to move super slowly because I don't want a motion blur.

## July 02, 2026
Today I moved from monocular calibration into stereo calibration. Uh it did not really work. So I thought it was fine at first because when I did image rectification, the horizontal lines lined up:

![Image rectification](../assets/projects/tomato/image_rectification.png)

Like surely that's a good sign right lol. The calibration also seemed good at first because the reprojection error looked reasonable. I had a stereo reprojection error around 0.51 px, which made it seem like the calibration was successful. But when I checked the baseline being used by ROS, something was clearly wrong. The physical camera baseline was about 10 cm, but my ```stereo/disparity``` topic was reporting a baseline around 0.203 m, almost double the real distance. Uh so that wasn't good.

I lowk started crashing out after this because it was also 92 degrees in my apartment because the AC stopped working, so I just lied in bed for a couple hours until I had an epiphany about the asymmetric circles pattern.

So basically the problem was I was reporting the distance parameter for my calibration pattern as the distance between the centers of two circles. But ROS actually expects half that distance. Ahaaaa yeah ok. So I recalibrated with that new distance and it worked well.

## July 03, 2026

I moved on to SGBM, which I decided was going to be more effective than Block Matching after some brief stereo matching research.

This was the depth map after no tuning.

![Initial SGBM](../assets/projects/tomato/initial_sgbm.png)

I hung a tomato I bought from Stop and Shop on my coat rack to test the depth.

![Tomato coat rack](../assets/projects/tomato/tomato_coat_rack.png)

After tuning, the estimate was around 88cm and my measured was around 87. I didn't measure too precisely so further testing is needed, but I this was pretty good for minimal tuning. No image of the depth map right now because everytime I try to open the map, something crashes lol.

## July 06, 2026
We wanted to decide on a camera mount location today. I did some basic calculations with the origin as the shoulder joint. I ended up with the camera mounted at (-20, 0, 65) aimed 45 degrees downwards where x is forwards/backwards, y is left/right, and z is up/down.

I think we're going to need a more sophisticated way to measure the workspace area because right now I'm just doing the length of the arms * 0.6 or 0.8 because I'm basically assuming the robot will hover around 60% to 80% of it's max reach. Idk I think it works for now though.

After taking the derivative of the depth formula, I also calculated that if the the camera is mounted 20 cm behind the shoulder joint, after 1 px error in disparity will result in a 4.73 mm error irl. I think that's fine? Idk maybe we'll have to alter that a bit.

![Preliminary Camera Mount Calculations](../assets/projects/tomato/preliminary_cam_mount_math.pdf)

## July 07, 2026
After reading this paper: [A “Global–Local” Visual Servo System for Picking Manipulators](https://www.mdpi.com/1424-8220/20/12/3366), I'm attempting a more complex way of measuring the robot arm workspace rather than just doing 60-80% of the max reach.

My rough steps I'm going to go through over the next couple days:

1. Define robot coordinate system
- I already did this, the origin is the first joint

2. Define arm geometry
- I already did this with the URDF file

3. Learn Denavit–Hartenberg method and define its parameters

4. Implement forward kinematics to define joints

5. Add joint limits
- this is in the URDF file

6. Monte Carlo sample the workplace
- basically for many samples, randomly choose joint angles within the limit and compute the end-effector position with forward kinematics and then plot all the points (this is a method they do in the paper)

7. Choose practical picking region
- from workspace point cloud, pick the region where the tomatos should realistically be harvested

8. Define candidate camera mount poses

9. Transform workspace points into the camera frame

10. Verify camera FOV and that every point in the practical picking regin is in the camera FOV

## July 08, 2026

Today I kept going with the workspace modeling thing from yesterday and finally got the DH + Monte Carlo workflow running. Lowk DH was confusing at first because everyone keeps talking about previous z axes and current x axes like that is supposed to be obvious, but I think I get the basic idea now. Each joint gets a transformation matrix, and multiplying all of them together gives the end-effector position.

First I cleaned up the URDF a bit. I split the wrist and end-effector attachment so the arm still has four active joints, and then the end effector is attached with a fixed joint. So the actual moving joints are still:

1. `joint_1`: base yaw
2. `joint_2`: shoulder pitch
3. `joint_3`: elbow pitch
4. `joint_4`: wrist pitch

and then `joint_5` is just a fixed joint from `wrist_link` to `end_effector_link`.

I also confirmed the coordinate system again because I keep getting paranoid about frames lol. I am using `base_link` as the origin, with `x` forward/back, `y` left/right, and `z` up/down. I also confirmed that all joints set to 0 in RViz is the real robot zero position. In that pose, all the links point straight up, so the end effector should have basically `x = 0` and `y = 0`, and the `z` position should just be the stacked link lengths.

The geometry I used was:

```text
h  = 0.10597 m   # base_link origin to shoulder pitch joint
L1 = 0.1778 m    # shoulder to elbow
L2 = 0.1524 m    # elbow to wrist
L3 = 0.0345 m    # wrist to end_effector_link attachment
```

For the actual tomato contact point, I might later use the full wrist-to-tip offset instead:

```text
L3 = 0.0345 + 0.03193 = 0.06643 m
```

Then I made the DH parameter table. Using `base_link` as the origin:

| i | Joint | Meaning | θᵢ | dᵢ | aᵢ | αᵢ |
|---|---|---|---|---|---|---|
| 1 | `joint_1` | base yaw | q₁ | 0.10597 | 0 | −π/2 |
| 2 | `joint_2` | shoulder pitch | q₂ − π/2 | 0 | 0.1778 | 0 |
| 3 | `joint_3` | elbow pitch | q₃ | 0 | 0.1524 | 0 |
| 4 | `joint_4` | wrist pitch + EE offset | q₄ | 0 | 0.0345 | 0 |

The annoying part was the `q₂ − π/2` offset. It's because the usual DH setup assumes the arm points along +x at zero, but my robot zero pose points straight up. So the offset basically makes the math match my actual robot instead of forcing the robot to match the textbook convention.

I verified the DH model against RViz with `tf2_echo`. For the all-zero pose, RViz/TF gave:

```text
Translation: [-0.000, 0.000, 0.471]
```

The DH model predicted:

```text
z = 0.10597 + 0.1778 + 0.1524 + 0.0345
z = 0.47067 m
```

I also ran some FK checks in code:

```text
zero_pose
  DH matrix FK:   x= 0.00, y=-0.00, z= 47.07 cm
  Fast FK:        x= 0.00, y= 0.00, z= 47.07 cm

shoulder_30_deg
  DH matrix FK:   x= 18.23, y=-0.00, z= 42.18 cm
  Fast FK:        x= 18.23, y= 0.00, z= 42.18 cm

shoulder_90_deg
  DH matrix FK:   x= 36.47, y= 0.00, z= 10.60 cm
  Fast FK:        x= 36.47, y= 0.00, z= 10.60 cm

elbow_30_deg
  DH matrix FK:   x= 9.35, y=-0.00, z= 44.56 cm
  Fast FK:        x= 9.34, y= 0.00, z= 44.56 cm

wrist_30_deg
  DH matrix FK:   x= 1.73, y=-0.00, z= 46.60 cm
  Fast FK:        x= 1.72, y= 0.00, z= 46.60 cm

yaw_90_shoulder_30
  DH matrix FK:   x= 0.00, y= 18.23, z= 42.18 cm
  Fast FK:        x= 0.00, y= 18.23, z= 42.18 cm
```

The `shoulder_90_deg` result made sense because the arm becomes horizontal, so the forward reach is

```text
17.78 + 15.24 + 3.45 = 36.47 cm
```

and the height is just the shoulder height

```text
z = 10.60 cm
```

After that I did the Monte Carlo workspace sampling like in the paper I read yesterday. I sampled 100,000 random joint configurations inside the joint limits, computed the FK for each one, and plotted the reachable end-effector points. I limited `joint_1` to the front half of the robot because for tomato picking idt I care about the arm reaching behind itself right now.

The reachable workspace bounds are below

```text
x range: -36.4 to  36.4 cm
y range: -36.3 to  36.4 cm
z range: -8.8 to  47.1 cm
```

This also makes sense because the current model only goes to the end-effector attachment, not the full tomato contact tip:

```text
17.78 + 15.24 + 3.45 = 36.47 cm
```

Then I defined a practical tomato-picking workspace (this is lowk based on educated vibes)

```text
x = 24 to 32 cm
y = -10 to 10 cm
z = 15 to 20 cm
```

Out of 100,000 sampled configurations, 332 points landed inside that practical workspace:

```text
Points inside practical tomato workspace: 332
Percent inside practical workspace: 0.33%
```

The top-view plot shows the full reachable workspace and the practical picking box. The box is in the forward region around `x = 24–32 cm` and `y = -10 to 10 cm`, which supports my original rough target point with my scuffed math around `(28, 0, 18)` cm. But now the point is justified by the arm's actual reachable workspace.

![Top View Workspace](../assets/projects/tomato/workspace_top_monte_carlo.png)

This is an improvement over my initial camera mount calculation because the old method only aimed the camera at one estimated center point. Now I can show the tomato-picking region is reachable, then use those reachable workspace points to evaluate where the stereo camera should go.

## July 10, 2026
After those calculations from a couple days ago, we assembled the base today.

![Base 1](../assets/projects/tomato/base1.png)
![Base 2](../assets/projects/tomato/base2.png)

It's finally able to be clamped down to the table and I can move the arm without clutching the base with the other hand. I looked at the cameras and the angle, height, and distance behind from origin all look great, but I'll need to do more testing tomorrow.

The stereo cameras will also need to be recalibrated because the image rectification doesn't look accurate anymore.

Motors also need to be recalibrated so the zero position has the base rotation the right direction.

## July 11, 2026
Motors and cameras have been recalibrated. The depth map also looks good. Yes I'm using an apple jellycat as a tomato.

![Disparity Map](../assets/projects/tomato/disparity_map.png)

From my brief testing, the depth calculation from the disparity map also looks pretty accurate. It's around 70cm away from the camera.

Tomorrow I'm planning on building out the rest of the pipeline before eye-to-hand calibration and kinematics:

1. Take ROI from left camera image (from YOLO tomato detection or maybe manual for now idk because I only have an apple jellycat)
2. Look at the same ROI in the disparity map
3. Compute the median disparity of the valid pixels
4. Compute depth in cm
5. Compute 3d coordinate of the tomato center

## July 12, 2026
I made my way through the pipeline today.

### ROI
When I take the ROI from the left camera image, I shrink it by 20%, so I only get the enter of the tomato and not the edges, which would make the depth farther than the surface would be.

### 3D Position Estimation

Once the median disparity is computed, I convert it into depth using the stereo camera model,

\[
Z = \frac{fB}{d},
\]

where \(f\) is the focal length, \(B\) is the stereo baseline, and \(d\) is the median disparity. Using the camera intrinsics from the left camera, I then back-project the center of the detection into a 3D point in the left camera frame. This gives the estimated position of the tomato relative to the camera.


### Eye-to-hand calibration
I also did eye-to-hand calibration, which wasn't really calibration or more just math to find a final matrix transformation because I knew where the camera was with respect to the robot origin.
![Eye-to-hand calibration](../assets/projects/tomato/eye_hand_calibration.pdf)

### Controller Pipeline

With the 3D position available in the robot base frame, I completed the first version of the controller. It synchronizes the ripeness detections with the stereo disparity image, computes the 3D position of every detected tomato, and filters out detections with unreliable disparity estimates. For each valid tomato, it computes the corresponding position in the robot base frame and prepares a simple horizontal approach consisting of pregrasp, contact, and retreat waypoints. So basically each approach has three segments. These waypoints are then passed into the inverse kinematics solver to compute the required joint angles.

### IK

The math of IK is below. I first find the base yaw and then only focus on joint 2 and 3. For joint 4, I'm just assuming I approach horizontally for now to simplify things.

![IK](../assets/projects/tomato/IK.pdf)

Uh so as for the outcome. It's lowk kinda scuffed right now lol

![IK Day 1](../assets/projects/tomato/IK_day1.mov)

Idk we'll debug it tomorrow. Likely issues are

1. Robot thinks tomato is farther than it is
2. camera to base transformation is wrong
3. IK is wrong
4. Contact point is js too aggressive
5. Controller is commanding center of tomato instead of surface
6. URDF has issues

## July 13, 2026
Lots of debugging today. Yesterday the robot was moving in vaguely the correct direction, but there were enough possible sources of error that I basically went through the whole motion pipeline one piece at a time.

First I checked the URDF geometry. I verified the zero pose, all the link-frame positions, the joint rotation directions, and the new ```tool_tip_link```. With every joint at zero, the tool tip ended up at the expected height:

```
0.10597 + 0.1778 + 0.1524 + 0.0345 + 0.03193 = 0.50260 m
```

So the URDF geometry seems fine. I also confirmed that the full wrist-to-suction-tip length is 0.06643 m, not just the 0.0345 m fixed joint that goes to the beginning of the end effector.

Then I checked the analytical IK solver. The actual planar IK math was mostly correct, but the solver was only loading ```joint_5``` from the URDF and was ignoring the additional ```tool_tip_joint```. This meant it thought the tool was 3.193 cm shorter than it actually is, which is lowk a huge issue when trying to touch the tomato surface accurately. That's why I was having issues yesterday with the tomato not being in reach when it was clearly in reach. I updated it so the full tool length is included.

After that I tested the manually defined camera-to-base transform by itself. I published fake points in the left camera optical frame and visualized the camera origin, optical axes, viewing ray, and transformed point in RViz. I checked movements along camera +X, +Y, and +Z, and they all mapped into the expected robot directions. So the basic transform math also seems correct.

The image below is the transformation of the camera point (0, 0, 0.5), basically 50 cm in front of the camera.
![Transformation Debugging](../assets/projects/tomato/transformation_debugging.png)

Next I tested back-projection using the real rectified CameraInfo. I took a known pixel and depth and converted it into a 3D camera-frame point using:

```
X = (u - cx)Z / fx
Y = (v - cy)Z / fy
Z = depth
```

I didn't see any issues there, so I just decided to send it lol.

First attempt today:
![IK Day 2 Attempt 1](../assets/projects/tomato/IK_day2_attempt1.mov)

This looked ok but I started tuning some offsets.

I also found that joint 1 (the base joint) was inverted after this attempt.
![IK Day 2 Attempt 2](../assets/projects/tomato/IK_day2_attempt2.mov)

After fixing that, I started finding that it was consistently overshooting, so I changed the percentile of disparity to 75, so that it would value the greater disparities (greater disparity means object is closer), so it essentially prioritizes the center of the tomato the most, which is the closest.

Then I started seeing that it was consistently below the tomato with these attempts:
![IK Day 2 Attempt 3](../assets/projects/tomato/IK_day2_attempt3.MP4)
![IK Day 2 Attempt 4](../assets/projects/tomato/IK_day2_attempt4.MP4)

At the end, I basically had three offsets for all three axes. This is what we ended the day with (big wait in between first and second execution because I was bypassing safeguards I set up):

![IK Day 2 Attempt 5](../assets/projects/tomato/IK_day2_attempt5.mov)

Pretty happy with the result. I'm slightly concerned with the offsets being specific to this apple jellycat, so we'll have to verify that. I'm gonna print some custom tomatos that are actually accurately sized tomorrow to hopefully have multiple tomatos on the coat rack lol.

## July 15, 2026
I assembled my mock tomato plant today with some questionable looking 3D printed tomatoes.

![3D printed tomatoes](../assets/projects/tomato/3d_printed_tomatoes.png)

Then I assembled them onto a coat rack.

![tomato_tree1](../assets/projects/tomato/tomato_tree1.png)

View from the stereo camera and YOLO detection:

![tomato_tree2](../assets/projects/tomato/tomato_tree2.png)
![tomato_tree3](../assets/projects/tomato/tomato_tree3.png)

## July 17, 2026

I spent the past couple days expanding the robot from approaching one tomato into an actual multi-tomato harvesting pipeline. This built on the first controller and IK system I had working earlier, where the robot estimated a tomato’s 3D position and generated pregrasp, contact, and retreat waypoints.

The perception system can now detect multiple tomatoes at once and give each one a persistent ID. Originally the detection IDs were regenerated every frame, which made them switch around constantly and made selecting a specific tomato really difficult.

I also expanded the dashboard so I can see all detected tomatoes, their ripeness and confidence, and manually select a reachable tomato by ID.

Once movement is approved, the robot now runs through the full harvesting sequence:

```pregrasp → contact → hold → retreat → return home → resume scanning```

Here is the whole pipeline with the dashboard:

![Dashboard picking](../assets/projects/tomato/dashboard_picking.mp4)

The workflow is basically you select a tomato that's reachable, approve to move end effector to the tomato, retract arm when you're ready and then the controller goes back to scanning reachable tomatoes.

I do find it pretty annoying that some tomatoes are in reach and then the next frame they're not. This is definitely because of some noise in the disparity map of the stereo cameras. Another issue I see is that between tomatoes, it takes a long time to rescan. All possible areas for improvement for sure.

## July 18, 2026

We connected the vacuum end effector to the arm today. 

![Vacuum attachment 2](../assets/projects/tomato/vacuum_attachment2.png)
<!-- ![Vacuum attachment 1](../assets/projects/tomato/vacuum_attachment.png) -->
![Vacuum attachment 3](../assets/projects/tomato/vacuum_attachment3.png)

While this was a big step towards an actual working prototype, there were some unexpected consequences of attaching the vacuum. The main problem was that the vacuum tube is inflexible, so the wrist can't bend backwards. The wrist has effectively lost half of its range of motion.

The problem with losing half of its range of motion is that a lot of tomatos that were previously pickable are now deemed as unreachable. An example below:

![Unreachable tomato](../assets/projects/tomato/unreachable_tomato_example.png)

We want the wrist to approach horizontally from the front (perpendicular to the axis of calyx). If the wrist could rotate backwards, it would have a better shot. In general, the new end effector being longer and also having a positive z offset is making a lot of tomatoes unreachable from the current distance from the base. In fact, the max reach of the arm has increased 6 cm from 40cm to around 46cm, so this is not unexpected.

Now the obvious solution is to just move the tomatos farther away and have the pickable area be around 40-50cm instead of 30-40cm as it is right now. However, the problem with that is I did my calculatioins on camera height, pitch, and distance behind base with the initial max reach of 40cm, so if I move it far enough away that more tomatoes are reachable for the arm, the camera can't see them anymore.

We have a few solutions. Either increase camera height, move camera closer to the base, or change camera pitch. Camera pitch is the easiest for us to change, so I set up a simulation in gazebo to try out different angles.

Right now we are at 45 degrees and below is 30 degrees, 35 degrees, and 40 degrees. The tomato plant is 55cm tall and the tallest tomatoes are at around 50cm.

![Camera angle 30](../assets/projects/tomato/camera_angle30.png)
![Camera angle 35](../assets/projects/tomato/camera_angle35.png)
![Camera angle 40](../assets/projects/tomato/camera_angle40.png)

35 degrees looks like a nice in between. I'll probably do some calculations tomorrow to confirm, but just visually speaking, 30 degrees captures the entire plant, but the top is kinda unnecessary because the robot can't reach those anyway. 40 degrees obscures some top tomatoes that we might have a shot at, so I think 35 degrees is a good middle ground.