import sys
if sys.version_info[0] == 2:  # Just checking your Python version to import Tkinter properly.
    from Tkinter import *
else:
    from tkinter import *
 
root = Tk()
 
menubar = Menu(root)
menubar.add_command(label="Hello!", command=None)
# menubar.add_command(label="Quit!", command=root.quit)

# display the menu
root.config(menu=menubar)

root.overrideredirect(True)
root.geometry("{0}x{1}+0+0".format(root.winfo_screenwidth(), root.winfo_screenheight()))
root.focus_set()  # <-- move focus to this widget
root.bind("<Escape>", lambda e: root.quit())
# root.wm_attributes(fullscreen='true') 
root.mainloop()