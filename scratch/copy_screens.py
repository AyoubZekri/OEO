import os
import shutil
import re

source_dir = r"d:\MyProject\KaidNews\kaidnews\src\View\Screen\MeetingsGroup\Tabs"
dest_dir = r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen"

meetings_src = os.path.join(source_dir, "Meetings")
decisions_src = os.path.join(source_dir, "Decisions")

meetings_dst = os.path.join(dest_dir, "Meetings")
decisions_dst = os.path.join(dest_dir, "Decisions")

os.makedirs(meetings_dst, exist_ok=True)
os.makedirs(decisions_dst, exist_ok=True)

# Copy Meetings
shutil.copy2(os.path.join(meetings_src, "MeetingsController.ts"), os.path.join(meetings_dst, "MeetingsController.ts"))
shutil.copy2(os.path.join(meetings_src, "MeetingsTab.css"), os.path.join(meetings_dst, "Meetings.css"))

with open(os.path.join(meetings_src, "MeetingsTab.tsx"), "r", encoding="utf-8") as f:
    meetings_tsx = f.read()
    
# Replace MeetingsTab.css -> Meetings.css
meetings_tsx = meetings_tsx.replace("MeetingsTab.css", "Meetings.css")
# Replace MeetingsTab -> Meetings
meetings_tsx = meetings_tsx.replace("MeetingsTab", "Meetings")

with open(os.path.join(meetings_dst, "Meetings.tsx"), "w", encoding="utf-8", newline="\n") as f:
    f.write(meetings_tsx)


# Copy Decisions
shutil.copy2(os.path.join(decisions_src, "DecisionsController.ts"), os.path.join(decisions_dst, "DecisionsController.ts"))
shutil.copy2(os.path.join(decisions_src, "DecisionsTab.css"), os.path.join(decisions_dst, "Decisions.css"))

with open(os.path.join(decisions_src, "DecisionsTab.tsx"), "r", encoding="utf-8") as f:
    decisions_tsx = f.read()

# Replace DecisionsTab.css -> Decisions.css
decisions_tsx = decisions_tsx.replace("DecisionsTab.css", "Decisions.css")
# Replace DecisionsTab -> Decisions
decisions_tsx = decisions_tsx.replace("DecisionsTab", "Decisions")

with open(os.path.join(decisions_dst, "Decisions.tsx"), "w", encoding="utf-8", newline="\n") as f:
    f.write(decisions_tsx)

print("Screens copied and renamed successfully.")
