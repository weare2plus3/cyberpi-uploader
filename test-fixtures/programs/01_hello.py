# Hello CyberPi: text on screen, LEDs and a sound.
import event, cyberpi


@event.start
def on_start():
    cyberpi.display.clear()
    cyberpi.display.show_label("Hello!", 16, "center")
    cyberpi.led.on(0, 255, 0)          # all LEDs green
    cyberpi.audio.play("hello")
