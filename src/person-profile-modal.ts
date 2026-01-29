// ABOUTME: Modal for creating and editing person profiles
// ABOUTME: Manages direct report information including role, level, and team
import {App, Modal, Notice} from 'obsidian';
import OneOnOneManager from './main';
import {PersonProfile} from './types';

export class PersonProfileModal extends Modal {
	plugin: OneOnOneManager;
	profile: PersonProfile;
	onSave: (profile: PersonProfile) => void;
	isNew: boolean;

	constructor(app: App, plugin: OneOnOneManager, profile: PersonProfile | null, onSave: (profile: PersonProfile) => void) {
		super(app);
		this.plugin = plugin;
		this.isNew = profile === null;
		this.profile = profile || {
			name: '',
			role: '',
			level: '',
			team: '',
			reportsTo: '',
			startDate: '',
			notes: ''
		};
		this.onSave = onSave;
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: this.isNew ? 'Add Person' : 'Edit Person'});

		const form = contentEl.createEl('form');

		this.createField(form, 'Name *', 'text', this.profile.name || '', (value) => {
			this.profile.name = value;
		}, 'Full name');

		this.createField(form, 'Role', 'text', this.profile.role || '', (value) => {
			this.profile.role = value;
		}, 'e.g. Senior Software Engineer');

		this.createField(form, 'Level', 'text', this.profile.level || '', (value) => {
			this.profile.level = value;
		}, 'e.g. L4, IC3, Senior');

		this.createField(form, 'Team', 'text', this.profile.team || '', (value) => {
			this.profile.team = value;
		}, 'Team name');

		this.createField(form, 'Reports To', 'text', this.profile.reportsTo || '', (value) => {
			this.profile.reportsTo = value;
		}, 'Their manager (if not you)');

		this.createField(form, 'Start Date', 'date', this.profile.startDate || '', (value) => {
			this.profile.startDate = value;
		});

		const notesDiv = form.createEl('div', {cls: 'form-field'});
		notesDiv.createEl('label', {text: 'Notes'});
		const notesArea = notesDiv.createEl('textarea', {
			attr: {
				rows: '4',
				placeholder: 'Any additional notes about this person'
			}
		});
		notesArea.value = this.profile.notes || '';
		notesArea.addEventListener('input', () => {
			this.profile.notes = notesArea.value;
		});

		const buttonDiv = form.createEl('div', {cls: 'form-buttons'});
		
		const saveBtn = buttonDiv.createEl('button', {text: 'Save', type: 'submit'});
		saveBtn.addEventListener('click', async (e) => {
			e.preventDefault();
			await this.save();
		});

		const cancelBtn = buttonDiv.createEl('button', {text: 'Cancel', type: 'button'});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});
	}

	private createField(
		container: HTMLElement, 
		label: string, 
		type: string, 
		initialValue: string,
		onChange: (value: string) => void,
		placeholder?: string
	): void {
		const div = container.createEl('div', {cls: 'form-field'});
		div.createEl('label', {text: label});
		const input = div.createEl('input', {type});
		input.value = initialValue;
		if (placeholder) input.placeholder = placeholder;
		
		input.addEventListener('input', () => {
			onChange(input.value);
		});
	}

	async save(): Promise<void> {
		if (!this.profile.name.trim()) {
			new Notice('Please enter a name');
			return;
		}

		try {
			this.onSave(this.profile);
			new Notice(`${this.isNew ? 'Added' : 'Updated'} ${this.profile.name}`);
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Error saving person: ${message}`);
		}
	}

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}
