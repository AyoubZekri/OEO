import os

file_path = 'd:/MyProject/KaidNews/OlympicOEO/src/View/Mobile/MobileDisciplinary/MobileDisciplinary.css'

with open(file_path, 'rb') as f:
    content = f.read()

try:
    content_str = content.decode('utf-8')
except UnicodeDecodeError:
    content_str = content.decode('utf-8', errors='ignore')

if '/* --- Beautiful Hero Styles --- */' in content_str:
    content_str = content_str.split('/* --- Beautiful Hero Styles --- */')[0]
elif '\x00' in content_str:
    idx = content.find(b'\x00')
    if idx != -1:
        content_str = content[:idx].decode('utf-8', errors='ignore')

css = """
/* --- Beautiful Hero Styles --- */
.mdd-hero {
  position: relative;
  overflow: hidden;
  color: white !important;
  border: none !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
}

/* Base Gradient Patterns for different tones */
.mdd-hero.tone-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
}
.mdd-hero.tone-red {
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%) !important;
}
.mdd-hero.tone-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
}
.mdd-hero.tone-violet {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%) !important;
}
.mdd-hero.tone-slate {
  background: linear-gradient(135deg, #64748b 0%, #334155 100%) !important;
}

/* Adjust text colors inside hero */
.mdd-hero .md-type,
.mdd-hero .md-member strong,
.mdd-hero .md-member span {
  color: #ffffff !important;
}

.mdd-hero .md-status {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(4px);
}

.mdd-hero::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.8;
  pointer-events: none;
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content_str + css)
"""
