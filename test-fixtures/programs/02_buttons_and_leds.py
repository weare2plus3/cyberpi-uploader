# Press A for red, B for blue, joystick middle to switch off.
import event, cyberpi


@event.is_press("a")
def on_a():
    cyberpi.led.on(255, 0, 0)
    cyberpi.audio.play_tone(523, 0.1)


@event.is_press("b")
def on_b():
    cyberpi.led.on(0, 0, 255)
    cyberpi.audio.play_tone(659, 0.1)


@event.is_press("middle")
def on_middle():
    cyberpi.led.off()
