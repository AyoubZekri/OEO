import re
import os

files = [
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Meetings\Meetings.css",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Decisions\Decisions.css",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Meetings\Meetings.tsx",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Decisions\Decisions.tsx"
]

for file_path in files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace hardcoded 'white' background in CSS
    content = re.sub(r"background:\s*white;?", "background: var(--card-bg);", content, flags=re.IGNORECASE)
    
    # Replace any leftover '#ffffff'
    content = re.sub(r"#ffffff", "var(--card-bg)", content, flags=re.IGNORECASE)
    
    # In TSX, we had inline styles like background: 'white', which were replaced by background: 'var(--card-bg)', but let's make sure.
    content = re.sub(r"background:\s*'white'", "background: 'var(--card-bg)'", content, flags=re.IGNORECASE)
    content = re.sub(r'background:\s*"white"', 'background: "var(--card-bg)"', content, flags=re.IGNORECASE)
    
    # Let's fix the badge colors. It's best to use CSS classes, but we can also use CSS variables if they exist.
    # OlympicOEO doesn't have standard badge variables like --badge-success-bg, so we'll replace the hardcoded light backgrounds 
    # with `var(--bg)` and their text color with `var(--text)` so they adapt, or just use translucent `rgba` or standard `var(--accent-bg)`.
    # Let's just use `var(--bg-hover)` for badge background and keep the text color as the indicating color.
    content = content.replace("'#fef3c7'", "'var(--bg-hover)'")
    content = content.replace("'#d1fae5'", "'var(--bg-hover)'")
    content = content.replace("'#fee2e2'", "'var(--bg-hover)'")
    
    # Make sure text color of badges is readable in dark mode, usually we just keep the base color or var(--text-h)
    
    # Ensure inputs are completely transparent or var(--bg)
    # the css class .premium-input has `background: var(--bg);` but on focus it was `background: white;`.
    # we already replaced `background: white;` to `var(--card-bg);`
    
    # Replace white border
    content = re.sub(r"border:\s*1px solid white", "border: 1px solid var(--card-bg)", content, flags=re.IGNORECASE)

    # Some specific fixes for modal overlay text if any
    
    with open(file_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

print("White backgrounds and remaining hardcoded styles fixed.")
