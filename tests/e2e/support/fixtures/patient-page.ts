import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class PatientPage {
  private readonly page: Page;
  private readonly teamSlug: string;
  private readonly patientsHeading: Locator;
  private readonly addPatientButton: Locator;
  private readonly firstNameField: Locator;
  private readonly lastNameField: Locator;
  private readonly mobileField: Locator;
  private readonly genderSelect: Locator;
  private readonly saveButton: Locator;
  private readonly cancelButton: Locator;
  private readonly searchField: Locator;
  private readonly deletePatientButton: Locator;
  private readonly confirmDeleteButton: Locator;
  private readonly editPatientButton: Locator;

  constructor(page: Page, teamSlug: string) {
    this.page = page;
    this.teamSlug = teamSlug;
    this.patientsHeading = this.page.getByRole('heading', {
      name: 'Patients',
    });
    this.addPatientButton = this.page.getByRole('button', {
      name: 'Add Patient',
    });
    this.firstNameField = this.page.getByPlaceholder('First Name');
    this.lastNameField = this.page.getByPlaceholder('Last Name');
    this.mobileField = this.page.getByPlaceholder('Mobile Number');
    this.genderSelect = this.page.getByRole('combobox', { name: 'Gender' });
    this.saveButton = this.page.getByRole('button', {
      name: 'Save',
      exact: true,
    });
    this.cancelButton = this.page.getByRole('button', {
      name: 'Cancel',
      exact: true,
    });
    this.searchField = this.page.getByPlaceholder('Search patients...');
    this.deletePatientButton = this.page.getByRole('button', {
      name: 'Delete',
    });
    this.confirmDeleteButton = this.page.getByRole('button', {
      name: 'Delete Patient',
    });
    this.editPatientButton = this.page.getByRole('button', {
      name: 'Edit',
    });
  }

  async goto() {
    await this.page.goto(`/teams/${this.teamSlug}/patients`);
    await this.page.waitForURL(`/teams/${this.teamSlug}/patients`);
    await this.patientsPageVisible();
  }

  async patientsPageVisible() {
    await expect(this.patientsHeading).toBeVisible();
  }

  async patientExists(firstName: string, lastName: string) {
    await expect(this.patientRow(firstName, lastName)).toBeVisible();
  }

  async patientDoesNotExist(firstName: string, lastName: string) {
    await expect(this.patientRow(firstName, lastName)).not.toBeVisible();
  }

  private patientRow(firstName: string, lastName: string) {
    return this.page.getByRole('row', {
      name: new RegExp(`${firstName}.*${lastName}`, 'i'),
    });
  }

  private patientCell(text: string) {
    return this.page.getByRole('cell', { name: text });
  }

  async openAddPatientModal() {
    await this.addPatientButton.click();
    await expect(
      this.page.getByRole('heading', {
        name: 'Add New Patient',
      })
    ).toBeVisible();
  }

  async fillPatientForm(data: {
    firstName: string;
    lastName: string;
    mobile?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }) {
    await this.firstNameField.fill(data.firstName);
    await this.lastNameField.fill(data.lastName);

    if (data.mobile) {
      await this.mobileField.fill(data.mobile);
    }

    if (data.gender) {
      await this.genderSelect.selectOption(data.gender);
    }
  }

  async savePatient() {
    await this.saveButton.click();
  }

  async cancelPatientForm() {
    await this.cancelButton.click();
  }

  async addPatient(data: {
    firstName: string;
    lastName: string;
    mobile?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }) {
    await this.openAddPatientModal();
    await this.fillPatientForm(data);
    await this.savePatient();

    // Wait for success message or patient to appear in list
    await expect(
      this.page.getByText('Patient added successfully')
    ).toBeVisible();
  }

  async searchPatient(searchTerm: string) {
    await this.searchField.fill(searchTerm);
    // Wait for search results to load
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    await this.searchField.clear();
    await this.page.waitForTimeout(500);
  }

  async editPatient(
    currentFirstName: string,
    currentLastName: string,
    newData: {
      firstName?: string;
      lastName?: string;
      mobile?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
    }
  ) {
    // Find the patient row and click edit
    const patientRow = this.patientRow(currentFirstName, currentLastName);
    await patientRow.getByRole('button', { name: 'Edit' }).click();

    await expect(
      this.page.getByRole('heading', {
        name: 'Edit Patient',
      })
    ).toBeVisible();

    // Update fields if provided
    if (newData.firstName !== undefined) {
      await this.firstNameField.clear();
      await this.firstNameField.fill(newData.firstName);
    }

    if (newData.lastName !== undefined) {
      await this.lastNameField.clear();
      await this.lastNameField.fill(newData.lastName);
    }

    if (newData.mobile !== undefined) {
      await this.mobileField.clear();
      await this.mobileField.fill(newData.mobile);
    }

    if (newData.gender !== undefined) {
      await this.genderSelect.selectOption(newData.gender);
    }

    await this.savePatient();

    await expect(
      this.page.getByText('Patient updated successfully')
    ).toBeVisible();
  }

  async deletePatient(firstName: string, lastName: string) {
    // Find the patient row and click delete
    const patientRow = this.patientRow(firstName, lastName);
    await patientRow.getByRole('button', { name: 'Delete' }).click();

    // Confirm deletion in modal
    await expect(
      this.page.getByRole('heading', {
        name: 'Delete Patient',
      })
    ).toBeVisible();

    await this.confirmDeleteButton.click();

    await expect(
      this.page.getByText('Patient deleted successfully')
    ).toBeVisible();
  }

  async viewPatientDetails(firstName: string, lastName: string) {
    const patientRow = this.patientRow(firstName, lastName);
    await patientRow.getByRole('button', { name: 'View' }).click();

    await expect(
      this.page.getByRole('heading', {
        name: 'Patient Details',
      })
    ).toBeVisible();
  }

  async checkPatientDetails(data: {
    firstName: string;
    lastName: string;
    mobile?: string;
    gender?: string;
    createdBy?: string;
  }) {
    await expect(
      this.page.getByText(`Name: ${data.firstName} ${data.lastName}`)
    ).toBeVisible();

    if (data.mobile) {
      await expect(this.page.getByText(`Mobile: ${data.mobile}`)).toBeVisible();
    }

    if (data.gender) {
      await expect(this.page.getByText(`Gender: ${data.gender}`)).toBeVisible();
    }

    if (data.createdBy) {
      await expect(
        this.page.getByText(`Created by: ${data.createdBy}`)
      ).toBeVisible();
    }
  }

  async checkFormValidation(
    field: 'firstName' | 'lastName',
    errorMessage: string
  ) {
    const fieldLocator =
      field === 'firstName' ? this.firstNameField : this.lastNameField;
    await fieldLocator.clear();
    await this.saveButton.click();

    await expect(this.page.getByText(errorMessage)).toBeVisible();
  }

  async checkEmptyState() {
    await expect(this.page.getByText('No patients found')).toBeVisible();
  }

  async checkPagination() {
    // Check if pagination controls are visible when there are many patients
    const nextButton = this.page.getByRole('button', { name: 'Next' });
    const prevButton = this.page.getByRole('button', { name: 'Previous' });

    return {
      hasNext: await nextButton.isVisible(),
      hasPrevious: await prevButton.isVisible(),
    };
  }

  async goToNextPage() {
    await this.page.getByRole('button', { name: 'Next' }).click();
    await this.page.waitForTimeout(500);
  }

  async goToPreviousPage() {
    await this.page.getByRole('button', { name: 'Previous' }).click();
    await this.page.waitForTimeout(500);
  }
}
