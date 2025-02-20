import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, clockworkApiKey, firmApiKey, firmSlug } = body;

    // In production, this would be a real API call
    // const response = await fetch(
    //   `https://api.clockworkrecruiting.com/v3.0/setpiecepeople_search?q=${encodeURIComponent(query)}`,
    //   {
    //     headers: {
    //       'X-API-Key': clockworkApiKey,
    //       'Accept': 'application/json',
    //       'Authorization': firmApiKey
    //     }
    //   }
    // );
    // const data = await response.json();

    // For now, return mock response
    const mockResponse = {
      peopleSearch: [
        {
          id: "6ae0bd2c-e0ae-402e-a479-d8d14104df9d",
          name: "Lisa Hwang",
          createdAt: "2024-09-19 22:17:16",
          updatedAt: "2024-10-22 13:13:04",
          loadedAt: "2024-09-19 22:17:16",
          firstName: "Lisa",
          lastName: "Hwang",
          doNotContact: false,
          noRelocation: false,
          preferredEmailAddress: "lisa@nationbuilder.com",
          preferredWebSite: null,
          preferredLinkedinUrl:
            "https://www.linkedin.com/in/lisa-hwang-88609a20",
          preferredImAccount: null,
          preferredPhoneNumber: null,
          preferredAddress: "Los Angeles, California, United States",
          lastImportedUpdatedAt: "2024-09-19 22:17:17",
          mostRecentNoteUpdatedAt: null,
          assistant: null,
          positions: [
            {
              id: "a41e7bcc-e7e6-4d37-a63a-1f8d9cd21278",
              title: "VP of People and Operations",
              companyId: "83f15b1d-95dc-4289-9e71-95222617c844",
              companyName: "NationBuilder",
              startDate: "2016-09-01 00:00:00",
              type: "current",
            },
            // ... other positions ...
          ],
          compensation: [
            {
              id: "ac28c889-8885-4b24-8b27-3935b7dba67c",
              startYear: null,
              endYear: null,
              salary: 1000000,
              bonus: 0,
              equity: "3.0",
              bonusType: "cash",
              equityType: "percent",
              description: "",
              currencyId: "11ed72de-f752-ea60-8223-069b8b3570ef",
              isPreferred: true,
            },
          ],
          addresses: [
            {
              id: "fadb6c6e-680e-4a30-a0e1-d355fb6d3946",
              street: "Los Angeles, California, United States",
              locationTypeId: "11ed72e1-fc11-a596-8223-069b8b3570ef",
              createdAt: "2024-09-19 22:17:16",
              updatedAt: "2024-09-19 22:17:16",
              formattedAddress: "Los Angeles, California, United States",
            },
          ],
          phoneNumbers: null,
          tags: null,
          schools: [
            {
              id: "7df024b4-7bbe-402c-ae10-d4d565e41de1",
              name: "Stanford  University Graduate School of Education",
            },
            // ... other schools ...
          ],
          user: null,
          emails: [
            {
              id: "6ffaa979-e580-4dbe-b47b-cda48677a9ef",
              address: "lisa@nationbuilder.com",
              locationTypeId: "11ed72e1-fc11-a791-8223-069b8b3570ef",
              createdAt: "2024-09-19 22:17:16",
              updatedAt: "2024-09-19 22:17:16",
            },
          ],
          notes: null,
          assistantName: "",
        },
        // ... other people ...
      ],
      meta: {
        total: 6,
        page: 1,
      },
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
