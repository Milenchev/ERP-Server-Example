const express = require("express");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 5001;
var db = new sqlite3.Database("crmServer.db");

app.use(cors());
app.use(express.urlencoded({ extend: true, limit: "50mb", parameterLimit: 50000 }));
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/outgoingInvoices", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM outgoingInvoices", [], (err, rows) => {
        res.end(JSON.stringify({ outgoingInvoices: rows }));
    });
});

app.get("/incomingInvoices", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM incomingInvoices", [], (err, rows) => {
        res.end(JSON.stringify({ incomingInvoices: rows }));
    });
});

app.get("/clients", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM clients", [], (err, rows) => {
        res.end(JSON.stringify({ clients: rows }));
    });
});

app.get("/offers", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM offers", [], (err, rows) => {
        res.end(JSON.stringify({ offers: rows }));
    });
});

app.get("/storage", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM storage", [], (err, rows) => {
        res.end(JSON.stringify({ storage: rows }));
    });
});

app.get("/storageItems", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    db.all("SELECT * FROM storageItems WHERE storage_id = '" + req.query.storage_id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ storageItems: rows }));
    });
});

app.get("/updateStorageItemStorage", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    db.run("UPDATE storageItems SET `storage_id` = ? WHERE `uid` = ?", [req.query.storage_id, req.query.item_id], function (err) {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).send("Error inserting invoice");
        }

        // Send response back after processing
        res.end(JSON.stringify({ done: true }));
    });
});

app.get("/getDashboardInvoices", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM outgoingInvoices", [], (err, rows_outgoing) => {
        db.all("SELECT * FROM incomingInvoices", [], (err, rows_incoming) => {
            res.end(JSON.stringify({ incoming: rows_incoming, outgoing: rows_outgoing }));
        });
    });
});

app.get("/getProductbyInvoice_id", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    db.all("SELECT * FROM product WHERE invoice_id = '" + req.query.invoice_id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ product: rows }));
    });
});

app.get("/getArticle_id", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    console.log(req.query);
    db.all("SELECT * FROM repairArticles WHERE repair_id = '" + req.query.repair_id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ repairArticles: rows }));
    });
});

app.get("/offerProducts", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    db.all("SELECT * FROM offerProducts WHERE offerId = '" + req.query.offerId + "'", [], (err, rows) => {
        console.log(rows);
        res.end(JSON.stringify({ offerProducts: rows }));
    });
});

app.get("/repairs", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM repairs", [], (err, rows) => {
        res.end(JSON.stringify({ repairs: rows }));
    });
});

app.get("/repairArticles", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM repairArticles", [], (err, rows) => {
        res.end(JSON.stringify({ repairArticles: rows }));
    });
});

app.post("/addOutgoingInvoice", (req, res) => {
    let invoice_info = req.body.invoice;
    console.log(invoice_info);

    db.run(
        "INSERT INTO outgoingInvoices (date, client, invoiceValue, invoiceState, type, typeOfPayment) VALUES (?, ?, ?, ?, ?, ?)",
        [invoice_info.date, invoice_info.client, invoice_info.total_value, 0, invoice_info.type, invoice_info.typeOfPayment],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting invoice");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);

            // Iterate over the products and validate them
            invoice_info.products.forEach((product) => {
                // Validate product fields (name, price, quantity)
                if (product.name == "" || product.price === 0 || product.quantity === 0) {
                    console.log(`Skipping product due to missing fields: ${JSON.stringify(product)}`);
                    return;
                } else {
                    // Insert valid product into the database
                    db.run(
                        "INSERT INTO product (invoice_id, name, quantity, price, discount) VALUES (?, ?, ?, ?, ?)",
                        [this.lastID, product.name, product.quantity, product.price, product.discount],
                        function (err) {
                            if (err) {
                                console.error("Error inserting product:", err);
                            } else {
                                console.log(`Product inserted: ${product.name}`);
                            }
                        }
                    );
                }
            });

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

app.post("/addOffers", (req, res) => {
    let offer_info = req.body.offer;

    db.run(
        "INSERT INTO offers (clientName, mol, typeOfOffer, dateOfOffer, heading, price, state) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            offer_info.clientName,
            offer_info.mol,
            offer_info.typeOfOffer,
            offer_info.dateOfOffer,
            offer_info.heading,
            offer_info.price,
            offer_info.state,
        ],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting invoice");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);

            // Iterate over the products and validate them
            offer_info.products.forEach((product) => {
                // Validate product fields (name, price, quantity)
                if (product.name == "" || product.price === 0 || product.quantity === 0) {
                    console.log(`Skipping product due to missing fields: ${JSON.stringify(product)}`);
                    return;
                } else {
                    // Insert valid product into the database
                    db.run(
                        "INSERT INTO offerProducts (offerId, productName, unit, quantity, price) VALUES (?, ?, ?, ?, ?)",
                        [this.lastID, product.productName, product.unit, product.quantity, product.price],
                        function (err) {
                            if (err) {
                                console.error("Error inserting product:", err);
                            } else {
                                console.log(`Product inserted: ${product.name}`);
                            }
                        }
                    );
                }
            });

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

app.delete("/deleteOutgoingInvoices", (req, res) => {
    db.all("DELETE FROM outgoingInvoices WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ done: true }));
    });
    // console.log(req.query);
});

app.delete("/deleteClients", (req, res) => {
    db.all("DELETE FROM clients WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ done: true }));
    });
});

app.delete("/deleteRepair", (req, res) => {
    db.all("DELETE FROM repairs WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        db.all("DELETE FROM repairArticles WHERE repair_id = '" + req.query.id + "'", [], (err, rows) => {
            res.end(JSON.stringify({ done: true }));
        });
    });
});

app.delete("/deleteOffers", (req, res) => {
    db.all("DELETE FROM offers WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ done: true }));
    });
});

app.delete("/deleteStorageItems", (req, res) => {
    db.all("DELETE FROM storageItems WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ done: true }));
    });
});

app.delete("/deleteStorage", async (req, res) => {
    const storageId = req.query.id;

    if (!storageId) {
        return res.status(400).json({ error: "Missing storage ID" });
    }

    try {
        db.run("UPDATE storageItems SET storage_id = -1 WHERE storage_id = ?", [storageId]);

        const result = db.run("DELETE FROM storage WHERE uid = ?", [storageId]);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Storage not found" });
        }

        res.json({ message: "Storage deleted successfully, and items updated" });
    } catch (error) {
        console.error("Error deleting storage:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/updateStorageItems", async (req, res) => {
    const { storageId, newStorageId } = req.body; // Get the old and new storage IDs

    if (!storageId) {
        return res.status(400).json({ error: "Missing storage ID" });
    }

    try {
        // Update all items in the given storage to have a new storage_id (-1 by default)
        const result = await db.run("UPDATE storageItems SET storage_id = ? WHERE storage_id = ?", [newStorageId || -1, storageId]);

        if (result.changes === 0) {
            return res.status(404).json({ error: "No items found in this storage" });
        }

        res.json({ message: `Items moved to storage ID ${newStorageId || -1}` });
    } catch (error) {
        console.error("Error updating storage items:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/addIncomingInvoice", (req, res) => {
    let invoice_info = req.body.invoice;
    console.log(invoice_info);

    db.run(
        "INSERT INTO incomingInvoices (expDate, supplier, date, type, typeOfPayment, State, invoiceValue) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            invoice_info.expDate,
            invoice_info.supplierName,
            invoice_info.date,
            invoice_info.type,
            invoice_info.typeOfPayment,
            0,
            invoice_info.total_value,
        ],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting invoice");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

app.post("/addClients", (req, res) => {
    let client_info = req.body.clients;
    console.log(client_info);

    db.run(
        "INSERT INTO clients (firmName, clientName, mol, numDDS, adress, country, city, email, phoneNum, eik, clientType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            client_info.firmName,
            client_info.clientName,
            client_info.mol,
            client_info.dds,
            client_info.address,
            client_info.country,
            client_info.city,
            client_info.email,
            client_info.phone,
            client_info.eik,
            0,
        ],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting invoice");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

app.post("/addRepair", (req, res) => {
    let repair_info = req.body.repairs;

    db.run(
        "INSERT INTO repairs (client, arrivalDate, shipmentNum, sentDate, outgoingShipmentNum, Articles, state, serialNum) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            repair_info.client,
            repair_info.arrivalDate,
            repair_info.shipmentNum,
            repair_info.sentDate,
            repair_info.outgoingShipmentNum,
            repair_info.articles,
            repair_info.state,
            "",
        ],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting invoice");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);
            repair_info.repairArticles.forEach((repair) => {
                // Validate product fields (name, price, quantity)
                if (repair.serialNum == "") {
                    console.log(`Skipping product due to missing fields: ${JSON.stringify(repair)}`);
                    return;
                } else {
                    // Insert valid product into the database
                    db.run("INSERT INTO repairArticles (serialNum, repair_id) VALUES (?, ?)", [repair.serialNum, this.lastID], function (err) {
                        if (err) {
                            console.error("Error inserting product:", err);
                        } else {
                            console.log(`Product inserted: ${repair.serialNum}`);
                        }
                    });
                }
            });

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

app.post("/addItems", (req, res) => {
    let item_info = req.body.storageItems;

    db.run(
        "INSERT INTO storageItems (itemNum, itemName, Availability, storageType, type, position) VALUES (?, ?, ?, ?, ?, ?)",
        [item_info.itemNum, item_info.itemName, item_info.Availability, item_info.storageType, item_info.type, item_info.position],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting invoice");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

app.post("/addStorage", (req, res) => {
    let storage_info = req.body.storageName;
    console.log(storage_info);

    db.run("INSERT INTO storage (storageName) VALUES (?)", [storage_info.storageName], function (err) {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).send("Error inserting invoice");
        }

        console.log(`Data inserted successfully with ID: ${this.lastID}`);

        // Send response back after processing
        res.end(JSON.stringify({ done: true }));
    });
});

// app.post("/addOffers", (req, res) => {
//     let offer_info = req.body;
//     console.log(offer_info);

//     db.run('INSERT INTO offers (clientName, mol, typeOfOffer,  dateOfOffer, heading, price, state) VALUES (?, ?, ?, ?, ?, ?, ?)',
//     [offer_info.clientName, offer_info.mol, offer_info.typeOfOffer, offer_info.dateOfOffer, offer_info.heading, offer_info.price, offer_info.state],
//     function(err) {
//         if (err) {
//             console.error('Error inserting data:', err);
//             return res.status(500).send('Error inserting invoice');
//         }

//         console.log(`Data inserted successfully with ID: ${this.lastID}`);

//         // Send response back after processing
//         res.end(JSON.stringify({"done": true}));
//     });
// });

app.delete("/deleteIncomingInvoices", (req, res) => {
    db.all("DELETE FROM incomingInvoices WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ done: true }));
    });
    // console.log(req.query);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
