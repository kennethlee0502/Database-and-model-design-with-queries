const express = require("express");
const { Provider, Client, Plan, JournalEntry } = require("./db");

const app = express();

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));

// Home page
app.get("/", (req, res) => {
  res.send(`
        <html>
            <head><title>Home</title></head>
            <body>
                <h1>Welcome to the System</h1>
                <ul>
                    <li><a href="/providers">View Providers</a></li>
                    <li><a href="/clients">View Clients</a></li>
                    <li><a href="/plans">View Plans</a></li>
                </ul>
            </body>
        </html>
    `);
});

// Route to show all providers
app.get("/providers", async (req, res) => {
  try {
    // Fetching all providers from the database;
    const providers = await Provider.findAll();
    // loop over providers to show the data that related to provider
    const providerList = providers
      .map(
        (provider) =>
          `<li>
          <a href="/providers/${provider.id}">${provider.name}</a> - 
          <a href="/providers/${provider.id}/journal-entries">View Journal Entries</a>
        </li>`
      )
      .join("");
    //Sending the front end response.
    res.send(`
        <html>
          <head><title>Providers</title></head>
          <body>
            <h1>Providers</h1>
            <ul>${providerList}</ul>
            <a href="/">Back to Home</a>
          </body>
        </html>
      `);
  } catch (err) {
    //Handling any server errors
    res.status(500).send("Server Error");
  }
});

// Route to view all clients
app.get("/clients", async (req, res) => {
  try {
    //Fetching all clients from the database
    const clients = await Client.findAll();
    // loop over client to show the data that realated to client
    const clientList = clients
      .map(
        (client) =>
          `<li><a href="/clients/${client.id}">${client.name}</a></li>`
      )
      .join("");
    //Sending the front end response.
    res.send(`
            <html>
                <head><title>Clients</title></head>
                <body>
                    <h1>Clients</h1>
                    <ul>${clientList}</ul>
                    <a href="/">Back to Home</a>
                </body>
            </html>
        `);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Route to view all plans
app.get("/plans", async (req, res) => {
  try {
    //Fetching all Plans from the database
    const plans = await Plan.findAll({ include: [Provider, Client] });
    // loop over client to show the data that realated to client
    const planList = plans
      .map(
        (plan) =>
          `<li>${plan.planType} - Provider: ${plan.provider.name}, Client: ${plan.client.name}</li>`
      )
      .join("");
    //Sending the front end response.
    res.send(`
            <html>
                <head><title>Plans</title></head>
                <body>
                    <h1>Plans</h1>
                    <ul>${planList}</ul>
                    <a href="/">Back to Home</a>
                </body>
            </html>
        `);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Route to view a specific provider and their plans
app.get("/providers/:providerId", async (req, res) => {
  try {
    const provider = await Provider.findByPk(req.params.providerId, {
      include: {
        model: Plan,
        include: [Client],
      },
    });
    if (provider) {
      const planList = provider.plans
        .map(
          (plan) =>
            `<li>Plan: ${plan.planType}, Client: ${
              plan.client ? plan.client.name : "No Client"
            }</li>`
        )
        .join("");
      res.send(`
        <html>
          <head><title>${provider.name}</title></head>
          <body>
            <h1>${provider.name}</h1>
            <h2>${provider.email}</h2>
            <ul>${planList}</ul>
            <a href="/providers/${provider.id}/journal-entries">View Journal Entries</a>
            <br>
            <a href="/providers">Back to Providers</a>
          </body>
        </html>
      `);
    } else {
      res.status(404).send("Provider not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error: " + err.message);
  }
});

// Route to view a specific client, their plans, and sorted journal entries
app.get("/clients/:clientId", async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.clientId, {
      include: [
        {
          model: Plan,
          include: [Provider],
        },
        {
          model: JournalEntry,
          order: [["datePosted", "DESC"]],
        },
      ],
    });
    if (client) {
      const planList = client.plans
        .map(
          (plan) =>
            `<li>
            Plan: ${plan.planType}
             </li>
            <li>Provider: ${
              plan.provider ? plan.provider.name : "No Provider"
            }</li>
            `
        )
        .join("");
      const journalEntries = client.journalEntries
        .map(
          (entry) =>
            `<li>${entry.datePosted.toISOString().slice(0, 10)}: ${
              entry.text
            }</li>`
        )
        .join("");
      res.send(`
          <html>
              <head><title>${client.name}</title></head>
              <body>
                  <h1>${client.name}</h1>
                  <h2>${client.email}</h2>
                  <h2>Plans:</h2>
                  <ul>${planList}</ul>
                  <h2>Journal Entries:</h2>
                  <ul>${journalEntries}</ul>
                  <a href="/clients">Back to Clients</a>
              </body>
          </html>
        `);
    } else {
      res.status(404).send("Client not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error: " + err.message);
  }
});

// Route to view a specific plan
app.get("/plans/:planId", async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.planId, {
      include: [Provider, Client],
    });
    if (plan) {
      res.send(`
          <html>
              <head><title>Plan Details</title></head>
              <body>
                  <h1>Plan: ${plan.planType}</h1>
                  <p>Provider: ${
                    plan.provider ? plan.provider.name : "No Provider"
                  }</p>
                  <p>Client: ${plan.client ? plan.client.name : "No Client"}</p>
                  <a href="/plans">Back to Plans</a>
              </body>
          </html>
        `);
    } else {
      res.status(404).send("Plan not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error: " + err.message);
  }
});

// Route to get all journal entries for all clients of a specific provider
app.get("/providers/:providerId/journal-entries", async (req, res) => {
  try {
    const providerId = req.params.providerId;
    const plans = await Plan.findAll({
      where: { providerId: providerId },
      include: [
        {
          model: Client,
          include: [
            {
              model: JournalEntry,
              order: [["datePosted", "DESC"]], // Sorting journal entries
            },
          ],
        },
      ],
    });

    // Flatten and sort the journal entries
    const journalEntries = plans
      .flatMap((plan) => plan.client.journalEntries)
      .sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
    res.send(`
            <html>
                <head><title>Journal Entries</title></head>
                <body>
                    <h1>Journal Entries for Provider ID: ${providerId}</h1>
                    <ul>
                        ${journalEntries
                          .map(
                            (entry) =>
                              `<li>${entry.datePosted
                                .toISOString()
                                .slice(0, 10)}: ${entry.text}</li>`
                          )
                          .join("")}
                    </ul>
                    <a href="/providers">Back to Providers</a>
                </body>
            </html>
        `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
