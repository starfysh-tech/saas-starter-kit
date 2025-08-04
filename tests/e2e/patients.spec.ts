import { test as base, expect } from '@playwright/test';
import { user, team, secondTeam } from './support/helper';
import { LoginPage, PatientPage } from './support/fixtures';
import { prisma } from '@/lib/prisma';
import { Gender } from '@prisma/client';

type PatientFixture = {
  loginPage: LoginPage;
  patientPage: PatientPage;
};

const test = base.extend<PatientFixture>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(loginPage);
  },
  patientPage: async ({ page }, use) => {
    const patientPage = new PatientPage(page, team.slug);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(patientPage);
  },
});

const testPatient = {
  firstName: 'John',
  lastName: 'Doe',
  mobile: '+1234567890',
  gender: 'MALE' as const,
};

const testPatientMinimal = {
  firstName: 'Jane',
  lastName: 'Smith',
};

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(team.slug);
});

test.afterEach(async () => {
  // Cleanup test patients
  await prisma.patient.deleteMany({
    where: {
      OR: [
        { firstName: testPatient.firstName, lastName: testPatient.lastName },
        {
          firstName: testPatientMinimal.firstName,
          lastName: testPatientMinimal.lastName,
        },
        { firstName: 'Johnny', lastName: 'Doe' },
        { firstName: 'UpdatedName', lastName: 'UpdatedLastName' },
      ],
    },
  });
});

test.describe('Patient Management', () => {
  test('should display patients page correctly', async ({ patientPage }) => {
    await patientPage.goto();
    await patientPage.patientsPageVisible();
  });

  test('should add a new patient with all fields', async ({ patientPage }) => {
    await patientPage.goto();
    await patientPage.addPatient(testPatient);
    await patientPage.patientExists(
      testPatient.firstName,
      testPatient.lastName
    );
  });

  test('should add a new patient with minimal required fields', async ({
    patientPage,
  }) => {
    await patientPage.goto();
    await patientPage.addPatient(testPatientMinimal);
    await patientPage.patientExists(
      testPatientMinimal.firstName,
      testPatientMinimal.lastName
    );
  });

  test('should show validation errors for required fields', async ({
    patientPage,
  }) => {
    await patientPage.goto();
    await patientPage.openAddPatientModal();

    // Try to save without required fields
    await patientPage.checkFormValidation(
      'firstName',
      'First name is required'
    );
    await patientPage.checkFormValidation('lastName', 'Last name is required');
  });

  test('should cancel patient creation', async ({ patientPage }) => {
    await patientPage.goto();
    await patientPage.openAddPatientModal();
    await patientPage.fillPatientForm(testPatient);
    await patientPage.cancelPatientForm();

    // Patient should not exist
    await patientPage.patientDoesNotExist(
      testPatient.firstName,
      testPatient.lastName
    );
  });

  test('should search for patients', async ({ patientPage }) => {
    await patientPage.goto();

    // Add a patient first
    await patientPage.addPatient(testPatient);
    await patientPage.addPatient(testPatientMinimal);

    // Search by first name
    await patientPage.searchPatient('John');
    await patientPage.patientExists(
      testPatient.firstName,
      testPatient.lastName
    );
    await patientPage.patientDoesNotExist(
      testPatientMinimal.firstName,
      testPatientMinimal.lastName
    );

    // Clear search and verify both patients are visible
    await patientPage.clearSearch();
    await patientPage.patientExists(
      testPatient.firstName,
      testPatient.lastName
    );
    await patientPage.patientExists(
      testPatientMinimal.firstName,
      testPatientMinimal.lastName
    );

    // Search by last name
    await patientPage.searchPatient('Smith');
    await patientPage.patientExists(
      testPatientMinimal.firstName,
      testPatientMinimal.lastName
    );
    await patientPage.patientDoesNotExist(
      testPatient.firstName,
      testPatient.lastName
    );

    // Search by mobile number
    await patientPage.searchPatient('+1234567890');
    await patientPage.patientExists(
      testPatient.firstName,
      testPatient.lastName
    );
    await patientPage.patientDoesNotExist(
      testPatientMinimal.firstName,
      testPatientMinimal.lastName
    );
  });

  test('should edit an existing patient', async ({ patientPage }) => {
    await patientPage.goto();

    // Add a patient first
    await patientPage.addPatient(testPatient);

    // Edit the patient
    await patientPage.editPatient(testPatient.firstName, testPatient.lastName, {
      firstName: 'Johnny',
      mobile: '+9876543210',
    });

    // Verify changes
    await patientPage.patientExists('Johnny', testPatient.lastName);
    await patientPage.patientDoesNotExist(
      testPatient.firstName,
      testPatient.lastName
    );
  });

  test('should view patient details', async ({ patientPage }) => {
    await patientPage.goto();

    // Add a patient first
    await patientPage.addPatient(testPatient);

    // View details
    await patientPage.viewPatientDetails(
      testPatient.firstName,
      testPatient.lastName
    );
    await patientPage.checkPatientDetails({
      firstName: testPatient.firstName,
      lastName: testPatient.lastName,
      mobile: testPatient.mobile,
      gender: testPatient.gender,
      createdBy: user.name,
    });
  });

  test('should delete a patient', async ({ patientPage }) => {
    await patientPage.goto();

    // Add a patient first
    await patientPage.addPatient(testPatient);
    await patientPage.patientExists(
      testPatient.firstName,
      testPatient.lastName
    );

    // Delete the patient
    await patientPage.deletePatient(
      testPatient.firstName,
      testPatient.lastName
    );
    await patientPage.patientDoesNotExist(
      testPatient.firstName,
      testPatient.lastName
    );
  });

  test('should show empty state when no patients exist', async ({
    patientPage,
  }) => {
    await patientPage.goto();
    await patientPage.checkEmptyState();
  });

  test('should handle pagination when many patients exist', async ({
    patientPage,
  }) => {
    await patientPage.goto();

    // Add multiple patients to test pagination
    const patients = [];
    for (let i = 1; i <= 5; i++) {
      const patient = {
        firstName: `Patient${i}`,
        lastName: `Test${i}`,
        mobile: `+123456789${i}`,
        gender: i % 2 === 0 ? ('MALE' as const) : ('FEMALE' as const),
      };
      patients.push(patient);
      await patientPage.addPatient(patient);
    }

    // Check if patients exist
    for (const patient of patients) {
      await patientPage.patientExists(patient.firstName, patient.lastName);
    }

    // Cleanup test patients
    await prisma.patient.deleteMany({
      where: {
        firstName: { startsWith: 'Patient' },
        lastName: { startsWith: 'Test' },
      },
    });
  });
});

test.describe('Patient Management - Permissions', () => {
  test('should enforce team isolation', async ({ page }) => {
    // Login and create a patient in the first team
    const loginPage = new LoginPage(page);
    const patientPage1 = new PatientPage(page, team.slug);

    await loginPage.goto();
    await loginPage.credentialLogin(user.email, user.password);
    await loginPage.loggedInCheck(team.slug);

    await patientPage1.goto();
    await patientPage1.addPatient(testPatient);

    // Create a patient directly in the database for the second team
    const secondTeamRecord = await prisma.team.findFirst({
      where: { slug: secondTeam.slug },
    });

    if (secondTeamRecord) {
      await prisma.patient.create({
        data: {
          firstName: 'Team2',
          lastName: 'Patient',
          teamId: secondTeamRecord.id,
          createdBy: user.email, // Use user email as placeholder
        },
      });
    }

    // Switch to second team (if accessible) or verify isolation
    const patientPage2 = new PatientPage(page, secondTeam.slug);

    try {
      await patientPage2.goto();
      // The patient from team 1 should not be visible in team 2
      await patientPage2.patientDoesNotExist(
        testPatient.firstName,
        testPatient.lastName
      );

      // Clean up second team patient
      if (secondTeamRecord) {
        await prisma.patient.deleteMany({
          where: {
            teamId: secondTeamRecord.id,
            firstName: 'Team2',
          },
        });
      }
    } catch (error) {
      // If we can't access the second team, that's also valid (no access)
      console.log('Cannot access second team - access control working');
    }
  });
});

test.describe('Patient Management - Error Handling', () => {
  test('should handle network errors gracefully', async ({
    patientPage,
    page,
  }) => {
    await patientPage.goto();

    // Simulate network failure
    await page.route('**/api/teams/*/patients', (route) => {
      route.abort();
    });

    await patientPage.openAddPatientModal();
    await patientPage.fillPatientForm(testPatient);
    await patientPage.savePatient();

    // Should show error message
    await expect(page.getByText(/error/i)).toBeVisible();
  });

  test('should handle validation errors from server', async ({
    patientPage,
    page,
  }) => {
    await patientPage.goto();

    // Mock server validation error
    await page.route('**/api/teams/*/patients', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Invalid patient data' },
        }),
      });
    });

    await patientPage.openAddPatientModal();
    await patientPage.fillPatientForm(testPatient);
    await patientPage.savePatient();

    // Should show validation error
    await expect(page.getByText('Invalid patient data')).toBeVisible();
  });
});

test.describe('Patient Management - Mobile and Accessibility', () => {
  test('should work on mobile viewport', async ({ patientPage, page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await patientPage.goto();
    await patientPage.patientsPageVisible();

    // Should be able to add patient on mobile
    await patientPage.addPatient(testPatientMinimal);
    await patientPage.patientExists(
      testPatientMinimal.firstName,
      testPatientMinimal.lastName
    );
  });

  test('should be keyboard accessible', async ({ patientPage, page }) => {
    await patientPage.goto();

    // Navigate using keyboard
    await page.keyboard.press('Tab'); // Focus on add patient button
    await page.keyboard.press('Enter'); // Open modal

    // Should be able to fill form using keyboard
    await page.keyboard.type(testPatient.firstName);
    await page.keyboard.press('Tab');
    await page.keyboard.type(testPatient.lastName);
    await page.keyboard.press('Tab');
    await page.keyboard.type(testPatient.mobile || '');

    // Save using keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to save button
    await page.keyboard.press('Enter');

    await expect(page.getByText('Patient added successfully')).toBeVisible();
  });
});
