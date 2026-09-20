<!--
Add a new log entry with:

## Month Day, Year

Write progress notes here. Multiple paragraphs are okay.

![Image caption](../assets/projects/rover/image.jpg)
![Video caption](../assets/projects/rover/video.mp4)

Inline math: $x = y + z$
Display math:
$$
x = y + z
$$

Mark an important day by adding it to the milestones section:

## Milestones
- 🚀 Month Day, Year - Short note about why it mattered

The date should match a log entry heading. The icon shown on the page comes from
data-milestone-icon in rover.html, so the emoji here is optional.
-->

## Milestones

- 🚀 September 18, 2026 - Project start

## September 18, 2026

The subsystem I'm specifically working on right now is software for the arm. The good news is we got basic teleop working:

![Shoulder moving](../assets/projects/rover/shoulder_moving.mov)

Mechanical isn't fully finished, but there are three motors working right now. If you notice, the video only has one motor working.

Basically, the setup we're working toward has two CAN buses. One ROS 2 project can control both, but each motor just needs to be associated with the right interface and motor ID. We have working communication through the regular USB-CAN adapter, but getting the Teensy to serve as the interface for both buses is giving us issues.

The other annoying thing is that I'm developing in an Ubuntu VM through UTM on my Mac because the onboard RPI isn't available yet. 

Also getting motor IDs configured took more work than expected. The SDK's existing `setCanId()` and `getCanId()` both use command `0x79`, with different fields to distinguish writing from reading. On our firmware, neither produced the expected response. Instead, the SDK threw exceptions such as `Unexpected response '0x9a'` or `Unexpected response '0x92'`.

After I captured the raw CAN traffic to see what was actually happening, I found out with the manufacturer's CAN protocol manual, the newer ID-setting operation uses command `0x20` and `0x79` was discontinued. So I basically had to write a patch for the MyActuator SDK with an additional `setMotorId()` implementation that used the proper command code.

Oh and then the first version of the patch had a confusing failure where basically the write would time out, but after power-cycling the motor, the new ID worked.

```text
0x142  92 00 00 00 00 00 00 00    Read angle from motor 2
0x242  92 00 00 00 ee c2 ff ff    Normal reply from motor 2
0x142  80 00 00 00 00 00 00 00    Shut down motor 2
0x242  80 00 00 00 00 00 00 00    Shutdown acknowledgement
0x142  20 05 00 00 01 00 00 00    Set motor ID to 1
0x241  20 05 00 00 01 00 00 00    Acknowledgement from the new ID
```

The motor did acknowledge the write, with an exact echo of the request. It just sent that acknowledgement from the new ID's reply address. The SDK was still listening for the old address, so it discarded a valid reply and eventually timed out.

After I fixed the patch to accept acknowledge from either old or new reply address, it was working.

The next part was replacing the adapter arrangement with a Teensy 4.1 connected to two SN65HVD230 CAN transceiver modules.

| Module | Teensy controller | Module CTX/TX connects to | Module CRX/RX connects to |
| --- | --- | --- | --- |
| Board 1 | CAN3 | Pin 31 | Pin 30 |
| Board 2 | CAN1 | Pin 22 | Pin 23 |

The Teensy didn't initially expose a native SocketCAN interface, so I wrote firmware using FlexCAN_T4 that presents two USB serial ports and implements an SLCAN bridge on each, so Linux can identify them.

Now the problem is the Teensy accepts the serial commands and queues the requests, but reports CAN errors. We repeatedly saw `F24`, meaning error warning and error-passive, and later `F80`, meaning bus-off.

After a lot of probing with a multimeter and trying to figure out how the oscilloscope worked, we've concluded it's a transceiver issue because:
- The motors communicate successfully through the regular USB-CAN adapter.
- The Teensy's CTX signal pulses at the transceiver input when we send a request.
- CAN-H and CAN-L both hover at around 1.6 V, so we're seeing activity going into the transceiver but no corresponding activity coming out lol
- We verified the module's 3.3 V supply and measured about 60 Ω between CAN-H and CAN-L with everything powered off, which is consistent with the termination we want

Erm so like idk, to be continued