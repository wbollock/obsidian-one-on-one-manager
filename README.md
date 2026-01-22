# 1:1 Manager - Obsidian Plugin for Engineering Managers

A comprehensive 1:1 management system designed for engineering managers to track meetings, coaching plans, private observations, and team development. Built around the core workflow of reflecting on conversations and maintaining coaching relationships.

## Core Philosophy

This plugin is designed around what engineering managers actually need: **private notes for reflection, coaching plans, and topic history**. It's not just about tracking meetings—it's about becoming a better manager through structured reflection and intentional coaching.

## Key Features

### 🔒 Private Manager Notes
Every 1:1 note has a separate "Private Manager Notes" section for your internal observations:
- **Your Observations**: Energy level, engagement, behavioral changes
- **Coaching Notes**: Patterns you're noticing, areas to work on
- **Your Reaction**: How you feel about the 1:1
- **Follow-up for Me**: Your commitments and action items

### 🎯 Coaching Plans
Dedicated coaching plan per person with:
- **Focus Areas**: What you're actively coaching them on (with priority levels)
- **Growth Experiments**: Stretch assignments and their outcomes
- **Feedback to Deliver**: Track what feedback needs to be delivered
- **Discussion Patterns**: What topics keep coming up?
- **Topic History**: Complete view of all topics discussed over time

### 📝 Post-1:1 Reflection Prompts
After creating a 1:1, you're prompted to reflect:
- How did they seem? (Energy & engagement)
- What stood out to you? (Observations)
- What do you want to coach them on?
- How do you feel about this conversation?
- What do YOU need to do?

### 👥 Person Management
- Add person profiles with role, level, team
- Track direct reports with metadata
- Quick actions: Create new 1:1, view coaching plan, edit profile
- Visual dashboard showing coaching relationships

### 📊 Analytics Dashboard
- Meeting frequency and trends
- Common themes across your team
- Action item completion rates
- Risk indicators (people who need attention)

## Installation & Setup

### Prerequisites

- Obsidian v0.15.0 or higher
- Node.js v16 or higher
- npm

### Local Development Setup

1. **Navigate to the plugin directory:**
   ```bash
   cd one-on-one-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the plugin:**
   ```bash
   npm run build
   ```
   
   This creates `main.js`, `styles.css`, and `manifest.json` in the root directory.

4. **Copy plugin to your Obsidian vault:**
   
   Copy the entire `one-on-one-manager` folder to your vault's plugins directory:
   
   - **Windows**: `<VaultFolder>\.obsidian\plugins\`
   - **Mac**: `<VaultFolder>/.obsidian/plugins/`
   - **Linux**: `<VaultFolder>/.obsidian/plugins/`
   
   Example:
   ```bash
   cp -r one-on-one-manager ~/Documents/MyVault/.obsidian/plugins/
   ```

5. **Enable the plugin in Obsidian:**
   - Open Obsidian
   - Go to Settings → Community plugins
   - Turn off "Safe mode" (if not already disabled)
   - Click "Reload plugins" (or restart Obsidian)
   - Find "1:1 Manager" in the list
   - Toggle it on

### Development Mode (Hot Reload)

For active development with automatic rebuilds:

```bash
npm run dev
```

This watches for file changes and rebuilds automatically. You'll need to reload the plugin in Obsidian after each build (Ctrl/Cmd+R or use the "Reload app without saving" command).

## Usage

### Quick Start Workflow

1. **Add Your Team**
   - Command Palette → "Add Person Profile"
   - Fill in name, role, level, team
   - Repeat for each direct report

2. **Create a 1:1**
   - Dashboard → Click "+ New 1:1" on person card
   - OR Command Palette → "Create 1:1 Meeting Note"
   - Fill in date, mood, topics

3. **During the Meeting**
   - Take notes in "Discussion Points"
   - Track action items with checkboxes
   - Note any topics discussed

4. **After the Meeting**
   - Reflection prompt appears automatically
   - Add your private observations
   - Note any coaching thoughts
   - Record your reaction

5. **Review Coaching Plan**
   - Click "📋 Plan" on person card
   - Review focus areas and patterns
   - Update growth experiments
   - Check feedback to deliver

### Creating a 1:1 Meeting Note

1. **Via Command Palette** (Ctrl/Cmd+P):
   - Type "Create 1:1 Meeting Note"
   - Fill in person name, date, mood, and topics
   - Click "Create"

2. **Note Structure:**
   ```markdown
   ---
   person: John Doe
   date: 2026-01-22
   mood: Good
   topics:
     - Project updates
     - Career goals
   ---
   
   # 1:1 with John Doe
   
   ## Discussion Points
   
   ### Project updates
   Discussed the Q1 roadmap and technical debt priorities...
   
   ## Action Items
   
   - [ ] Review architecture proposal @john 📅 2026-01-29
   - [x] Schedule team meeting
   
   ## Notes
   
   John mentioned interest in promotion. Need to discuss career path.
   
   ---
   
   ## 🔒 Private Manager Notes
   
   **My Observations:**
   Seemed more confident than last time. Brought up career growth 
   unprompted - good sign. Still avoiding conflict with peers.
   
   **Coaching Notes:**
   - Continue building confidence in technical discussions
   - Next: Give feedback about peer relationships
   - Watch for: Any signs of overwhelm with new project
   
   **My Reaction:**
   Great energy today. Feel good about their trajectory.
   
   **Follow-up for Me:**
   - Check in about peer feedback in 2 weeks
   - Prepare promotion packet outline
   ```

### Viewing Coaching Plans

Click "📋 Plan" on any person card to see:
- **Overview**: Role, level, focus areas count
- **Focus Areas**: Active coaching priorities
- **Growth Experiments**: Stretch assignments in progress
- **Feedback to Deliver**: Pending and delivered feedback
- **Discussion Patterns**: Topics that keep coming up
- **Topic History**: Complete chronological topic list

### Managing People

### Managing People

- **Add Person**: Dashboard → "+ Add Person" or Command Palette
- **Edit Profile**: Click ✏️ on person card
- **View Timeline**: Click person card to see all 1:1s
- **View Coaching Plan**: Click "📋 Plan" on person card

### Dashboard Overview

1. **Via Ribbon Icon**: Click the 👥 icon in the left sidebar
2. **Via Command Palette**: Type "Open Dashboard"

The dashboard shows:
- Quick actions: Add person, refresh
- Team member cards with:
  - Role and level
  - Meeting count and last meeting date
  - Action item completion rate
  - Top themes
  - Quick buttons: New 1:1, Coaching Plan, Edit
- Theme analysis across all meetings
- Outstanding action items

### Customizing Settings

Go to Settings → 1:1 Manager to configure:
- **1:1 Notes Folder**: Where meeting notes are stored (default: `1-1s`)
- **Coaching Plans Folder**: Where coaching plans are stored (default: `1-1s/coaching-plans`)
- **People Profiles Folder**: Where person profiles are stored (default: `1-1s/people`)
- **Theme Keywords**: Customize automatic theme detection

## Features in Detail

### Theme Extraction

The plugin automatically detects themes based on keywords in your notes:

- **Career Growth**: promotion, career, growth, development, advancement
- **Technical Challenges**: technical, bug, architecture, performance, complexity
- **Team Dynamics**: team, collaboration, communication, conflict
- **Workload**: workload, capacity, overwhelmed, bandwidth, burnout
- **Goals & OKRs**: goal, okr, objective, milestone, target
- **Feedback**: feedback, review, performance, improvement
- **Work-Life Balance**: balance, pto, vacation, time off, flexibility

Themes appear as colored badges in the dashboard and timeline views.

### Action Item Parsing

The plugin recognizes standard markdown checkboxes:

- `- [ ]` - Uncompleted action item
- `- [x]` - Completed action item
- `@person` - Assigned to someone
- `📅 YYYY-MM-DD` - Due date

Example:
```markdown
- [ ] Review PR #123 @sarah 📅 2026-01-25
- [x] Update documentation
```

### Best Practices

1. **Use Private Notes Consistently**: The real value is in your reflections, not just meeting logs
2. **Review Coaching Plans Weekly**: Update focus areas and check discussion patterns
3. **Be Honest in Observations**: These are private—capture what you really think
4. **Track Your Commitments**: Use "Follow-up for Me" to remember what YOU promised
5. **Update Growth Experiments**: Record outcomes when experiments complete
6. **Deliver Feedback Regularly**: Use the feedback tracker to stay accountable
7. **Notice Patterns**: If the same topic comes up repeatedly, that's a signal
8. **Consistent Naming**: Use the same person name across all meetings for accurate tracking
9. **Add Moods**: Track meeting sentiment over time to spot trends

## Project Structure

```
one-on-one-manager/
├── src/
│   ├── main.ts                      # Plugin entry point
│   ├── settings.ts                  # Settings configuration
│   ├── types.ts                     # TypeScript interfaces
│   ├── analyzer.ts                  # Meeting analysis engine
│   ├── people-manager.ts            # Person profile CRUD operations
│   ├── dashboard-view.ts            # Dashboard UI
│   ├── timeline-view.ts             # Timeline UI
│   ├── coaching-plan-view.ts        # Coaching plan UI
│   ├── create-meeting-modal.ts      # Meeting creation modal
│   ├── person-profile-modal.ts      # Person management modal
│   └── reflection-prompt-modal.ts   # Post-meeting reflection prompt
├── styles.css                       # Plugin styles
├── manifest.json                    # Plugin metadata
├── package.json                     # Dependencies
└── README.md                        # This file
```

## Troubleshooting

### Plugin doesn't appear in Obsidian
- Make sure you ran `npm run build`
- Check that the plugin folder is in the correct `.obsidian/plugins/` directory
- Reload Obsidian or toggle Safe mode off/on

### Dashboard is empty
- Make sure you've created some 1:1 notes in the configured folder
- Check that notes have proper frontmatter with `person` and `date` fields
- Try clicking the refresh icon in the dashboard

### Themes not detecting
- Verify your note content includes keywords from the theme list
- Check Settings → 1:1 Manager to see current theme keywords
- Keywords are case-insensitive

### Build errors
```bash
rm -rf node_modules
npm install
npm run build
```

## Development

### Building
```bash
npm run build      # Production build
npm run dev        # Development build with watch mode
```

### Linting
```bash
npm run lint
```

## License

This plugin uses the 0-BSD license.

## Contributing

Feel free to submit issues and enhancement requests!

---

**Made for engineering managers and ICs who want to level up their 1:1 game** 🚀
