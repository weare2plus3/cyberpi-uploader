# Copy this file to start a new script.
import event, time, cyberpi, mbot2, mbuild


@event.start
def on_start():
    cyberpi.console.println("ready")


@event.is_press("a")
def on_a():
    pass
