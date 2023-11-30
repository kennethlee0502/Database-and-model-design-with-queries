const Sequelize = require("sequelize");

// Database connection
const sequelize = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/workshop"
);

// Define models
const Provider = sequelize.define("provider", {
  name: Sequelize.STRING,
  email: { type: Sequelize.STRING, unique: true },
});

const Client = sequelize.define("client", {
  name: Sequelize.STRING,
  email: { type: Sequelize.STRING, unique: true },
});

const Plan = sequelize.define("plan", {
  planType: Sequelize.ENUM("basic", "premium"),
});

const JournalEntry = sequelize.define("journalEntry", {
  text: Sequelize.TEXT,
  datePosted: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
});

// Associations
Provider.hasMany(Plan);
Plan.belongsTo(Provider);

Client.hasMany(Plan);
Plan.belongsTo(Client);

Client.hasMany(JournalEntry);
JournalEntry.belongsTo(Client);

// Sync models with database and seed data
sequelize
  .sync({ force: true })
  .then(async () => {
    console.log("Database synchronized");
    await seedDatabase();
  })
  .catch((err) => {
    console.error("Failed to synchronize database:", err);
  });

// Seed database with example data
async function seedDatabase() {
  try {
    // Create Providers
    const provider1 = await Provider.create({
      name: "Hello",
      email: "Hello@example.com",
    });
    const provider2 = await Provider.create({
      name: "World",
      email: "World@example.com",
    });

    // Create Clients
    const client1 = await Client.create({
      name: "Adam",
      email: "Adam@example.com",
    });
    const client2 = await Client.create({
      name: "Eva",
      email: "Eva@example.com",
    });

    // Create Plans
    const plan1 = await Plan.create({
      planType: "basic",
      clientId: client1.id,
      providerId: provider1.id,
    });
    const plan2 = await Plan.create({
      planType: "premium",
      clientId: client2.id,
      providerId: provider1.id,
    });
    const plan3 = await Plan.create({
      planType: "basic",
      clientId: client1.id,
      providerId: provider2.id,
    });

    // Create Journal Entries
    function randomDate(start, end) {
      return new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );
    }
    await JournalEntry.create({
      text: "Entry 1 by Adam",
      datePosted: randomDate(new Date(2020, 0, 1), new Date()),
      clientId: client1.id,
    });
    await JournalEntry.create({
      text: "Entry 2 by Adam",
      datePosted: randomDate(new Date(2020, 0, 1), new Date()),
      clientId: client1.id,
    });
    await JournalEntry.create({
      text: "Entry 1 by Eva",
      datePosted: randomDate(new Date(2020, 0, 1), new Date()),
      clientId: client2.id,
    });
    console.log("Database seeded successfully");
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

module.exports = {
  sequelize,
  Provider,
  Client,
  Plan,
  JournalEntry,
};
