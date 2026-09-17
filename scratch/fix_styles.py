import re
import os

files = [
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Meetings\Meetings.tsx",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Decisions\Decisions.tsx",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Meetings\Meetings.css",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Decisions\Decisions.css"
]

color_map = {
    # Backgrounds
    r"'white'": "'var(--card-bg)'",
    r'"white"': '"var(--card-bg)"',
    r"background: white": "background: var(--card-bg)",
    r"'#ffffff'": "'var(--card-bg)'",
    r"'#f8fafc'": "'var(--bg)'",
    r"'#f1f5f9'": "'var(--bg-hover)'",
    r"'#f3f4f6'": "'var(--bg)'",
    r"'#e5e7eb'": "'var(--bg-hover)'",
    
    # Text
    r"'#0f172a'": "'var(--text-h)'",
    r"'#1e293b'": "'var(--text-h)'",
    r"'#334155'": "'var(--text)'",
    r"'#475569'": "'var(--text)'",
    r"'#64748b'": "'var(--text-muted)'",
    r"'#94a3b8'": "'var(--text-muted)'",
    
    # Borders
    r"'#e2e8f0'": "'var(--border)'",
    r"'#cbd5e1'": "'var(--border)'",
}

css_color_map = {
    # CSS specific
    r"#ffffff": "var(--card-bg)",
    r"#f9fafb": "var(--bg)",
    r"#f3f4f6": "var(--bg)",
    r"#f8fafc": "var(--bg)",
    r"#e5e7eb": "var(--border)",
    r"#e2e8f0": "var(--border)",
    r"#cbd5e1": "var(--border)",
    r"#111827": "var(--text-h)",
    r"#1f2937": "var(--text)",
    r"#374151": "var(--text)",
    r"#4b5563": "var(--text-muted)",
    r"#6b7280": "var(--text-muted)",
    r"#9ca3af": "var(--text-muted)",
}

for file_path in files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Determine which map to use based on extension
    if file_path.endswith('.tsx'):
        for old, new in color_map.items():
            content = re.sub(old, new, content, flags=re.IGNORECASE)
    elif file_path.endswith('.css'):
        for old, new in css_color_map.items():
            content = re.sub(old, new, content, flags=re.IGNORECASE)
            
        # Optional: we can remove body.dark-mode blocks in CSS if they just set colors we've now made variables.
        # But honestly, since we replaced hex colors with variables, those rules will just say:
        # body.dark-mode .class { background: var(--bg); } which is harmless and actually correct.
        
    with open(file_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

print("Styles updated successfully.")
