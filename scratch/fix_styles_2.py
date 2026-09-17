import re
import os

files = [
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Meetings\Meetings.css",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Decisions\Decisions.css",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Meetings\Meetings.tsx",
    r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen\Decisions\Decisions.tsx"
]

css_color_map = {
    r"#ffffff": "var(--card-bg)",
    r"#f9fafb": "var(--bg)",
    r"#f3f4f6": "var(--bg)",
    r"#f8fafc": "var(--bg)",
    r"#f1f5f9": "var(--bg-hover)",
    r"#e5e7eb": "var(--border)",
    r"#e2e8f0": "var(--border)",
    r"#cbd5e1": "var(--border)",
    
    # Text colors
    r"#0f172a": "var(--text-h)",
    r"#111827": "var(--text-h)",
    r"#1e293b": "var(--text-h)",
    r"#1f2937": "var(--text)",
    r"#334155": "var(--text)",
    r"#374151": "var(--text)",
    r"#475569": "var(--text)",
    r"#4b5563": "var(--text-muted)",
    r"#64748b": "var(--text-muted)",
    r"#6b7280": "var(--text-muted)",
    r"#9ca3af": "var(--text-muted)",
    r"#94a3b8": "var(--text-muted)",
    
    # Primary / Accents (Convert standard reds/blues to var(--accent) where they act as primary buttons, but leave status reds alone if possible. Actually, standard buttons in OlympicOEO are usually var(--accent).)
    r"linear-gradient\(135deg, #EF4444 0%, #B91C1C 100%\)": "var(--accent)",
    r"linear-gradient\(135deg, rgba\(239, 68, 68, 0.1\) 0%, rgba\(185, 28, 28, 0.1\) 100%\)": "var(--accent-bg)",
    r"rgba\(239, 68, 68, 0.4\)": "var(--shadow)",
    r"rgba\(239, 68, 68, 0.2\)": "transparent",
    r"rgba\(239, 68, 68, 0.15\)": "var(--accent-bg)",
    r"#EF4444": "var(--accent)",
    r"#B91C1C": "var(--accent-secondary)",
    
    # Specific fix for white that didn't get caught in CSS
    r"color: white": "color: var(--card-bg)", # Wait, if background is var(--accent), color should be white always? Yes. Let's not blindly replace 'white'.
}

for file_path in files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Apply the same comprehensive map to all files, handling hex values directly
    for old, new in css_color_map.items():
        content = re.sub(old, new, content, flags=re.IGNORECASE)
        
    # Manual fix for .premium-btn to keep text white when background is var(--accent)
    content = content.replace("color: var(--card-bg);", "color: #ffffff;") 
    
    with open(file_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

print("Buttons and extended styles updated successfully.")
