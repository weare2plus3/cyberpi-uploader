# mBot2 + Ultrasonic Sensor 2: drive forward, back off and turn when something is close.
# Press A to start, B to stop.
import event, time, cyberpi, mbot2, mbuild

running = False


@event.is_press("a")
def on_a():
    global running
    running = True
    while running:
        distance = mbuild.ultrasonic2.get(1)
        cyberpi.display.show_label(str(round(distance)) + " cm", 24, "center", index=0)
        if distance < 15:
            cyberpi.led.on(255, 0, 0)
            mbot2.backward(50, 0.4)
            mbot2.turn(90)
        else:
            cyberpi.led.on(0, 255, 0)
            mbot2.forward(50)
        time.sleep(0.05)
    mbot2.EM_stop("all")


@event.is_press("b")
def on_b():
    global running
    running = False
    mbot2.EM_stop("all")
    cyberpi.led.off()
