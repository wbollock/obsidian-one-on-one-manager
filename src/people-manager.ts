// ABOUTME: Service for managing person profiles
// ABOUTME: Handles CRUD operations for people data stored in vault
import {App, TFile, TFolder} from 'obsidian';
import {PersonProfile, AgendaItem} from './types';
import {OneOnOneSettings} from './settings';

export class PeopleManager {
	constructor(private app: App, private settings: OneOnOneSettings) {}

	async getAllPeople(): Promise<PersonProfile[]> {
		const folder = this.app.vault.getAbstractFileByPath(this.settings.peopleProfilesFolder);
		if (!folder) return [];

		const profiles: PersonProfile[] = [];
		const files = this.app.vault.getMarkdownFiles()
			.filter(f => f.path.startsWith(this.settings.peopleProfilesFolder));

		for (const file of files) {
			const profile = await this.loadPersonProfile(file);
			if (profile) profiles.push(profile);
		}

		return profiles.sort((a, b) => a.name.localeCompare(b.name));
	}

	async loadPersonProfile(file: TFile): Promise<PersonProfile | null> {
		try {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache?.frontmatter) return null;

			const fm = cache.frontmatter;
			return {
				name: fm.name || file.basename,
				role: fm.role,
				level: fm.level,
				team: fm.team,
				reportsTo: fm.reportsTo,
				startDate: fm.startDate,
				email: fm.email,
				slackHandle: fm.slackHandle,
				notes: fm.notes,
				agendaItems: fm.agendaItems || []
			};
		} catch (error) {
			console.error('Error loading person profile:', error);
			return null;
		}
	}

	async savePersonProfile(profile: PersonProfile): Promise<void> {
		const folder = this.settings.peopleProfilesFolder;
		const fileName = `${profile.name.replace(/\s+/g, '-')}.md`;
		const filePath = `${folder}/${fileName}`;

		const content = this.generateProfileContent(profile);

		try {
			const folderExists = this.app.vault.getAbstractFileByPath(folder);
			if (!folderExists) {
				await this.app.vault.createFolder(folder);
			}

			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile instanceof TFile) {
				await this.app.vault.modify(existingFile, content);
			} else {
				await this.app.vault.create(filePath, content);
			}
		} catch (error) {
			console.error('Error saving person profile:', error);
			throw error;
		}
	}

	private generateProfileContent(profile: PersonProfile): string {
		let content = '---\n';
		content += `name: ${profile.name}\n`;
		if (profile.role) content += `role: ${profile.role}\n`;
		if (profile.level) content += `level: ${profile.level}\n`;
		if (profile.team) content += `team: ${profile.team}\n`;
		if (profile.reportsTo) content += `reportsTo: ${profile.reportsTo}\n`;
		if (profile.startDate) content += `startDate: ${profile.startDate}\n`;
		if (profile.email) content += `email: ${profile.email}\n`;
		if (profile.slackHandle) content += `slackHandle: ${profile.slackHandle}\n`;
		if (profile.agendaItems && profile.agendaItems.length > 0) {
			content += 'agendaItems:\n';
			for (const item of profile.agendaItems) {
				content += `  - id: ${item.id}\n`;
				content += `    text: "${item.text.replace(/"/g, '\\"')}"\n`;
				content += `    dateAdded: ${item.dateAdded}\n`;
				if (item.priority) content += `    priority: ${item.priority}\n`;
				if (item.completed) content += `    completed: ${item.completed}\n`;
			}
		}
		content += '---\n\n';
		content += `# ${profile.name}\n\n`;
		if (profile.notes) {
			content += `## Notes\n\n${profile.notes}\n\n`;
		}
		return content;
	}

	async deletePersonProfile(name: string): Promise<void> {
		const folder = this.settings.peopleProfilesFolder;
		const fileName = `${name.replace(/\s+/g, '-')}.md`;
		const filePath = `${folder}/${fileName}`;

		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			await this.app.vault.delete(file);
		}
	}

	async addAgendaItem(personName: string, text: string, priority?: 'high' | 'medium' | 'low'): Promise<AgendaItem> {
		const profiles = await this.getAllPeople();
		const profile = profiles.find(p => p.name === personName);
		
		if (!profile) {
			throw new Error(`Person profile not found: ${personName}`);
		}

		if (!profile.agendaItems) {
			profile.agendaItems = [];
		}

		const today: string = new Date().toISOString().split('T')[0]!;
		const newItem: AgendaItem = {
			id: Date.now().toString(),
			text,
			dateAdded: today,
			completed: false
		};
		
		if (priority) {
			newItem.priority = priority;
		}

		profile.agendaItems.push(newItem);
		await this.savePersonProfile(profile);
		return newItem;
	}

	async removeAgendaItem(personName: string, itemId: string): Promise<void> {
		const profiles = await this.getAllPeople();
		const profile = profiles.find(p => p.name === personName);
		
		if (!profile || !profile.agendaItems) {
			return;
		}

		profile.agendaItems = profile.agendaItems.filter(item => item.id !== itemId);
		await this.savePersonProfile(profile);
	}

	async toggleAgendaItem(personName: string, itemId: string): Promise<void> {
		const profiles = await this.getAllPeople();
		const profile = profiles.find(p => p.name === personName);
		
		if (!profile || !profile.agendaItems) {
			return;
		}

		const item = profile.agendaItems.find(i => i.id === itemId);
		if (item) {
			item.completed = !item.completed;
			await this.savePersonProfile(profile);
		}
	}
}
