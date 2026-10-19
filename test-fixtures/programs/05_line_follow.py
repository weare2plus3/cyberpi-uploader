# mBot2 + Quad RGB Sensor: simple proportional line follower (dark line on light floor).
# Press A to start, B to stop.
import event, time, cyberpi, mbot2, mbuild

BASE_SPEED = 40   # RPM
KP = 0.6          # steering strength
running = False


@event.is_press("a")
def on_a():
    global running
    running = True
    while running:
        offset = mbuild.quad_rgb_sensor.get_offset_track(1)   # -100 (left) .. 100 (right)
        turn = KP * offset
        # EM1 is the left motor and is mirrored, so forward is (+, -).
        mbot2.drive_speed(BASE_SPEED + turn, -(BASE_SPEED - turn))
        time.sleep(0.01)
    mbot2.EM_stop("all")


@event.is_press("b")
def on_b():
    global running
    running = False
    mbot2.EM_stop("all")
