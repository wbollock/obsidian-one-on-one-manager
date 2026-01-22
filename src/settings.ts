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
	slackWebhookUrl?: string;
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
	slackWebhookUrl: ''
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

		containerEl.createEl('h3', {text: 'Slack Integration'});
		
		new Setting(containerEl)
			.setName('Slack Webhook URL')
			.setDesc('Optional: Webhook URL to post reflections to Slack')
			.addText(text => text
				.setPlaceholder('https://hooks.slack.com/services/...')
				.setValue(this.plugin.settings.slackWebhookUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.slackWebhookUrl = value;
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
