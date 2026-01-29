# 1:1 Manager

This is a plugin for managing your one-on-one meetings in Obsidian. If you're a manager (or lead, or anyone who has regular check-ins with people), this gives you a place to keep notes, track what you talked about, and remember what you actually need to do.

## Why this exists

Most one-on-one tools are either too prescriptive or just glorified calendar apps. This plugin assumes you already know how to have a conversation—it just helps you remember what happened and what patterns are emerging.

It's built around a few simple ideas:
- Your notes should live where your other notes live (in Obsidian)
- You need private space to write down what you actually think
- Patterns matter more than individual meetings
- Action items are pointless if nobody tracks them

## What it does

### Dashboard
You get a main view that shows everyone you have 1:1s with. For each person, you can see:
- How many meetings you've had
- When the last one was
- How many open action items they have
- What topics keep coming up

Click on someone's card to see all your meetings with them in chronological order.

### Meeting notes
When you create a 1:1 note, you get a structured template with sections for discussion points and action items. Action items are just markdown checkboxes—nothing fancy. The plugin counts incomplete items so you can see what's still hanging around.

After you create a meeting note, you get prompted to add private observations. This is the good stuff: what you noticed about the person's energy, what you're thinking about coaching-wise, how you felt about the conversation. These notes are stored separately and marked clearly as private.

### Goals tracking
Each person can have goals attached to them. You can track progress, add check-ins, note blockers. It's useful for performance review season or just keeping tabs on what people are working toward.

### People management
Add profiles for your direct reports (or whoever you meet with regularly). Track their role, level, team, start date. You can edit or delete people from the dashboard.

### Theme detection
The plugin looks at your meeting notes and automatically tags common themes: career growth, technical challenges, team dynamics, workload, etc. This helps you spot patterns—like if someone keeps bringing up the same concern but you haven't done anything about it yet.

## Setup

You'll need Obsidian v0.15.0+ and Node.js v16+ to build this.

1. Clone or download this repo into your vault's plugins folder:
   - Windows: `<YourVault>\.obsidian\plugins\one-on-one-manager`
   - Mac/Linux: `<YourVault>/.obsidian/plugins/one-on-one-manager`

2. Install and build:
   ```bash
   cd one-on-one-manager
   npm install
   npm run build
   ```

3. Enable the plugin in Obsidian:
   - Settings → Community plugins
   - Turn off Safe mode if it's on
   - Find "1:1 Manager" and toggle it on

For development, run `npm run dev` to auto-rebuild on changes. You'll still need to reload Obsidian (Ctrl/Cmd+R) to see updates.

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

### Adding Agenda Items

Capture topics to discuss in your next 1:1:

1. **Via Command Palette** (Ctrl/Cmd+P):
   - Type "Add Agenda Item for Next 1:1"
   - Select the person from the dropdown
   - Enter the topic you want to discuss
   - Click "Add Item"

2. **From Dashboard**:
   - Agenda items appear on each person card
   - Check off items as you discuss them
   - Delete items using the × button

Agenda items are stored in the person's profile and automatically cleared when checked off. This helps ensure important topics don't get lost between meetings.

### Managing Goals

Track goals and OKRs for each person with year-over-year tracking:

1. **View Goals**:
   - Click "🎯 Goals" button on any person card in the dashboard
   - Or use Command Palette → "View Goals"

2. **Create a Goal**:
   - In the Goals view, click "+ New Goal"
   - Fill in:
     - Title and description
     - Category (Career, Technical, Project, etc.)
     - Timeframe (Q1-Q4, 6-month, Annual, Custom)
     - Year and target dates
     - Key Results (optional measurable outcomes)
   - Click "Create Goal"

3. **Track Progress**:
   - Edit goals to update progress percentage
   - Add check-ins to record status updates
   - Note blockers that are preventing progress
   - Mark key results as completed

4. **Year Management**:
   - Switch between years using the year selector
   - Archive previous year's goals
   - Carry over incomplete goals to the current year
   - View year-over-year comparison stats

Goals are stored in separate files per person under the `goals/` folder and include:
- Progress tracking (0-100%)
- Status indicators (not-started, in-progress, at-risk, completed, abandoned)
- Key results with targets and current values
- Check-in history with notes and blockers
- Automatic at-risk detection based on timeline vs progress

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
  - Open action items count
  - Pending agenda items with checkboxes
  - Top themes
  - Quick buttons: New 1:1, Goals, Coaching Plan, Edit
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
│   ├── goals-manager.ts             # Goals and OKR management
│   ├── dashboard-view.ts            # Dashboard UI
│   ├── timeline-view.ts             # Timeline UI
│   ├── coaching-plan-view.ts        # Coaching plan UI
│   ├── goals-view.ts                # Goals tracking UI
│   ├── create-meeting-modal.ts      # Meeting creation modal
│   ├── person-profile-modal.ts      # Person management modal
│   ├── goal-modal.ts                # Goal creation/editing modal
│   ├── agenda-item-modal.ts         # Agenda item creation modal
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
