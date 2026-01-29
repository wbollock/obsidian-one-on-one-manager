// ABOUTME: Modal for post-1:1 reflection prompts
// ABOUTME: Helps managers capture observations and reactions after meetings
import {App, Modal, Notice, TFile} from 'obsidian';
import OneOnOneManager from './main';

export class ReflectionPromptModal extends Modal {
	plugin: OneOnOneManager;
	filePath: string;
	person: string;

	constructor(app: App, plugin: OneOnOneManager, filePath: string, person: string) {
		super(app);
		this.plugin = plugin;
		this.filePath = filePath;
		this.person = person;
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: '📝 Post-Meeting Reflection'});
		contentEl.createEl('p', {
			text: `Take a moment to reflect on your 1:1 with ${this.person}`,
			cls: 'reflection-subtitle'
		});

		const promptsDiv = contentEl.createEl('div', {cls: 'reflection-prompts'});

		const prompts = [
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
		];

		for (const {label, prompt} of prompts) {
			const promptDiv = promptsDiv.createEl('div', {cls: 'reflection-prompt-item'});
			promptDiv.createEl('strong', {text: label});
			promptDiv.createEl('p', {text: prompt, cls: 'reflection-prompt-text'});
		}

		const infoDiv = contentEl.createEl('div', {cls: 'reflection-info'});
		infoDiv.createEl('p', {
			text: '💡 These reflections go in the "🔒 Private Manager Notes" section of your 1:1 note.',
			cls: 'reflection-info-text'
		});

		const buttonDiv = contentEl.createEl('div', {cls: 'form-buttons'});
		
		const addNotesBtn = buttonDiv.createEl('button', {
			text: 'Add Reflections Now',
			type: 'button',
			cls: 'reflection-primary-btn'
		});
		addNotesBtn.addEventListener('click', async () => {
			await this.app.workspace.openLinkText(this.filePath, '', false);
			this.close();
		});

		const laterBtn = buttonDiv.createEl('button', {
			text: 'Skip for Now',
			type: 'button'
		});
		laterBtn.addEventListener('click', () => {
			this.close();
		});
	}

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}
