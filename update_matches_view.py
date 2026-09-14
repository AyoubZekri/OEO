import os
import re

file_path = 'src/View/Screen/Matches/Matches.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a function to determine the match result badge
badge_logic = '''
  const getMatchResultBadge = (match: Match) => {
    if (match.match_status === 'ملغاة') return <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>ملغاة</div>;
    if (match.match_status === 'مؤجلة') return <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>مؤجلة</div>;
    
    if (match.team_score !== undefined && match.team_score !== null && match.opponent_score !== undefined && match.opponent_score !== null) {
      const isWin = match.team_score > match.opponent_score;
      const isLoss = match.team_score < match.opponent_score;
      const isDraw = match.team_score === match.opponent_score;
      
      let bgColor = 'rgba(148, 163, 184, 0.1)';
      let color = '#64748b';
      let text = 'تعادل';
      
      if (isWin) {
        bgColor = 'rgba(16, 185, 129, 0.1)';
        color = '#10b981';
        text = 'فوز';
      } else if (isLoss) {
        bgColor = 'rgba(239, 68, 68, 0.1)';
        color = '#ef4444';
        text = 'خسارة';
      }
      
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: bgColor, color: color, padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
            {text}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-h)', letterSpacing: '2px', background: 'var(--bg)', padding: '2px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ color: isWin ? '#10b981' : isLoss ? '#ef4444' : 'var(--text-h)' }}>{match.team_score}</span> - {match.opponent_score}
          </div>
        </div>
      );
    }
    
    return null;
  };
'''

# Insert the function before return (
content = content.replace("return (\n    <div className=", badge_logic + "\n  return (\n    <div className=")

# Update the card header to include the badge
old_header = '''              <div className="mc-header">
                <div className="mc-title-group">
                  <div className="mc-title-icon">
                    <Shield size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 className="mc-title">{match.match_title}</h3>
                    <span className="mc-opponent">{match.opponent}</span>
                  </div>
                </div>
                <div className="mc-top-actions">'''

new_header = '''              <div className="mc-header" style={{ alignItems: 'flex-start' }}>
                <div className="mc-title-group">
                  <div className="mc-title-icon">
                    <Shield size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 className="mc-title">{match.match_title}</h3>
                    <span className="mc-opponent">{match.opponent}</span>
                    <div style={{ marginTop: '8px' }}>
                      {getMatchResultBadge(match)}
                    </div>
                  </div>
                </div>
                <div className="mc-top-actions">'''

content = content.replace(old_header, new_header)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
