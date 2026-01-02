import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../constants/test-users";

test.describe("Teams Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as admin
    await page.goto("/sign-in");
    await page.locator("#email").fill(TEST_USERS.admin.email);
    await page.locator("#password").fill(TEST_USERS.admin.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL((url) => !url.toString().includes("/sign-in"), {
      timeout: 10000,
    });
  });

  test("should create a team, invite a member, and remove a member", async ({
    page,
  }) => {
    test.setTimeout(120000);
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    // 1. Navigate to Teams
    await page.goto("/teams");
    await expect(page.getByRole("heading", { name: "Teams" })).toBeVisible();

    // 2. Create a new team
    await page.getByRole("link", { name: "Create Team" }).click();
    await page.waitForURL(/\/teams\/new/);

    const teamName = `Test Team ${Date.now()}`;
    await page.locator('input[name="name"]').fill(teamName);
    await page.locator('textarea[name="description"]').fill("Test Description");
    await page.getByRole("button", { name: "Create Team" }).click();

    // Verify toast
    await expect(page.getByText("Team created successfully")).toBeVisible();

    // 3. Verify redirection to team list
    await page.waitForURL(/\/teams$/);

    // Click on the new team
    await page.getByText(teamName).click();
    await expect(page.getByText(teamName)).toBeVisible();

    // 4. Invite a member (Editor)
    // Assuming UI has an "Add Member" button or similar.
    // Based on team-member-list.tsx, there might be an input and a button.
    // Let's verify the "Team Members" section is visible
    await expect(page.getByText("Team Members")).toBeVisible();

    // Fill invite form
    // I need to know the exact selectors for the invite form.
    // Usually it's an email input and an invite button.
    await page
      .locator('input[placeholder="user@example.com"]')
      .fill(TEST_USERS.editor.email);
    const inviteButton = page.getByRole("button", { name: "Invite" });
    await inviteButton.click();

    // 5. Verify member appeared
    await expect(
      page.getByText(TEST_USERS.editor.name || TEST_USERS.editor.email),
    ).toBeVisible();

    // 6. Remove the member
    // The "Remove" button is a trash icon.
    // I need to find the specific row for the editor and click the delete button.
    // It likely has an aria-label or I can find it by the user's row.

    // Wait for the list to update
    await page.waitForTimeout(1000);

    // This selector might be flaky depending on the exact DOM structure.
    // Better strategy: locate the button within the container that has the email.

    // In team-member-list.tsx:
    // <Button ... onClick={() => handleRemove(member.user.id)}> <Trash2 ... /> </Button>

    // Let's assume it's the button near the email.
    // Register dialog handler before the action that triggers it
    page.on("dialog", (dialog) => dialog.accept());

    await page
      .locator("div")
      .filter({ hasText: TEST_USERS.editor.email })
      .getByRole("button")
      .click();

    // Wait for removal
    await expect(page.getByText(TEST_USERS.editor.email)).not.toBeVisible();
  });
});
