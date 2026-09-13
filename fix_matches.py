import os

file_path = 'src/View/Screen/Matches/Matches.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the badge
old_badge = '''<span className="match-competition-badge">
                {match.competition || 'منافسة عامة'}
              </span>'''
new_badge = '''<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="match-competition-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                  {match.team?.name || 'فريق غير محدد'}
                </span>
                <span className="match-competition-badge">
                  {match.competition || 'منافسة عامة'}
                </span>
              </div>'''

content = content.replace(old_badge, new_badge)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
