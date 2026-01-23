// ABOUTME: Settings configuration for 1:1 Manager plugin
// ABOUTME: Defines user preferences for folders, templates, and theme detection
import {App, PluginSettingTab, Setting} from "obsidian";
import OneOnOneManager from "./main";

export interface OneOnOneSettings {
	oneOnOneFolder: string;
	coachingPlansFolder: string;
	peopleProfilesFolder: string;
	defaultMoods: string[];
	themeKeywords: Record<string, string[]>;
	meetingTemplate: string;
	reflectionPrompts: ReflectionPrompt[];
}

export interface ReflectionPrompt {
	label: string;
	prompt: string;
}

export const DEFAULT_SETTINGS: OneOnOneSettings = {
	oneOnOneFolder: '1-1s',
	coachingPlansFolder: '1-1s/coaching-plans',
	peopleProfilesFolder: '1-1s/people',
	defaultMoods: ['Great', 'Good', 'Okay', 'Challenging', 'Difficult'],
	themeKeywords: {
		'Career Growth': ['promotion', 'career', 'growth', 'development', 'advancement', 'level'],
		'Technical Challenges': ['technical', 'bug', 'architecture', 'performance', 'complexity', 'debt'],
		'Team Dynamics': ['team', 'collaboration', 'communication', 'conflict', 'relationship'],
		'Workload': ['workload', 'capacity', 'overwhelmed', 'bandwidth', 'burnout', 'stress'],
		'Goals & OKRs': ['goal', 'okr', 'objective', 'milestone', 'target', 'metric'],
		'Feedback': ['feedback', 'review', 'performance', 'improvement', 'recognition'],
		'Work-Life Balance': ['balance', 'pto', 'vacation', 'time off', 'hours', 'flexibility']
	},
	meetingTemplate: `---
person: {{person}}
date: {{date}}
{{#if mood}}mood: {{mood}}{{/if}}
{{#if topics}}topics:
{{#each topics}}  - {{this}}
{{/each}}{{/if}}
---

# 1:1 with {{person}}

**Date:** {{date}}
{{#if mood}}**Mood:** {{mood}}{{/if}}

## Discussion Points

### Topic 1


### Topic 2


## Action Items

- [ ] 
- [ ] 

## Notes


## Follow-up for Next Time


---

## 🔒 Private Manager Notes

<!-- This section is just for you - won't be shared -->

**My Observations:**


**Coaching Notes:**


**My Reaction:**


**Follow-up for Me:**

`,
	reflectionPrompts: [
		{
			label: 'Energy & Engagement',
			prompt: 'How did they seem? What was their energy level and engagement like?'
		},
		{
			label: 'Key Observations',
			prompt: 'What stood out to you? Any changes in behavior, concerns, or wins?'
		},
		{
			label: 'Coaching Notes',
			prompt: 'What do you want to coach them on? Any patterns emerging?'
		},
		{
			label: 'Your Reaction',
			prompt: 'How do you feel about this 1:1? Any concerns or positive feelings?'
		},
		{
			label: 'Follow-up Actions',
			prompt: 'What do YOU need to do? Any commitments you made?'
		}
	]
}

export class OneOnOneSettingTab extends PluginSettingTab {
	plugin: OneOnOneManager;

	constructor(app: App, plugin: OneOnOneManager) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: '1:1 Manager Settings'});

		new Setting(containerEl)
			.setName('1:1 Notes Folder')
			.setDesc('Where to store 1:1 meeting notes')
			.addText(text => text
				.setPlaceholder('1-1s')
				.setValue(this.plugin.settings.oneOnOneFolder)
				.onChange(async (value) => {
					this.plugin.settings.oneOnOneFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Coaching Plans Folder')
			.setDesc('Where to store private coaching plans for each person')
			.addText(text => text
				.setPlaceholder('1-1s/coaching-plans')
				.setValue(this.plugin.settings.coachingPlansFolder)
				.onChange(async (value) => {
					this.plugin.settings.coachingPlansFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('People Profiles Folder')
			.setDesc('Where to store person profile information')
			.addText(text => text
				.setPlaceholder('1-1s/people')
				.setValue(this.plugin.settings.peopleProfilesFolder)
				.onChange(async (value) => {
					this.plugin.settings.peopleProfilesFolder = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', {text: 'Theme Detection'});
		containerEl.createEl('p', {
			text: 'Customize keywords for automatic theme detection. Edit theme keywords in settings data file for advanced customization.',
			cls: 'setting-item-description'
		});

		const themesEl = containerEl.createEl('div', {cls: 'theme-keywords-display'});
		for (const [theme, keywords] of Object.entries(this.plugin.settings.themeKeywords)) {
			themesEl.createEl('div', {
				text: `${theme}: ${keywords.join(', ')}`,
				cls: 'theme-keyword-item'
			});
		}
	}
}
