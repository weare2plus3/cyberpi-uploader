# mBot2: press A to drive a 20 cm square.
import event, cyberpi, mbot2


@event.is_press("a")
def on_a():
    for _ in range(4):
        mbot2.straight(20)     # cm
        mbot2.turn(90)         # degrees, positive = right
    cyberpi.audio.play("yeah")
