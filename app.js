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

/* GET FUNCTIONS */
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

app.get("/getAllStorageItems", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM storageItems", [], (err, rows) => {
        res.end(JSON.stringify({ storageItems: rows }));
    });
});

app.get("/storageItems", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    db.all("SELECT * FROM storageItems WHERE storage_id = '" + req.query.storage_id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ storageItems: rows }));
    });
});

app.get("/automaticInvoices", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM automaticInvoices", [], (err, rows) => {
        res.end(JSON.stringify({ automaticInvoices: rows }));
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

app.get("/offerProducts", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    db.all("SELECT * FROM offerProducts WHERE offerId = '" + req.query.offerId + "'", [], (err, rows) => {
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

app.get("/orders", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT * FROM orders", [], (err, rows) => {
        res.end(JSON.stringify({ orders: rows }));
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
    db.all("SELECT * FROM repairArticles WHERE repair_id = '" + req.query.repair_id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ repairArticles: rows }));
    });
});

app.get("/getLastInvoiceNum", (req, res) => {
    res.setHeader("Content-Type", "application/json");

    db.all("SELECT MAX(invoice_num) FROM outgoingInvoices WHERE type = '" + req.query.invoice_type + "'", [], (err, rows) => {
        if (rows[0]["MAX(invoice_num)"] == null) {
            res.end(JSON.stringify({ invoice_num: "none" }));
        } else {
            res.end(JSON.stringify({ invoice_num: rows[0]["MAX(invoice_num)"] }));
        }

        // res.end(JSON.stringify({ done: true }));
    });
});

/* INSERT FUNCTIONS */

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

app.post("/addOutgoingInvoice", (req, res) => {
    let invoice_info = req.body.invoice;

    db.run(
        "INSERT INTO outgoingInvoices (invoice_num, date, client, clientId, invoiceValue, invoiceState, type, typeOfPayment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            invoice_info.invoiceNum,
            invoice_info.date,
            invoice_info.client,
            invoice_info.clientId,
            invoice_info.total_value,
            0,
            invoice_info.type,
            invoice_info.typeOfPayment,
        ],
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

app.post("/addOrder", (req, res) => {
    let order_info = req.body.orders;

    db.run("INSERT INTO orders (client, dateApplied) VALUES (?, ?)", [order_info.client, order_info.dateApplied], function (err) {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).send("Error inserting order");
        }

        `Data inserted successfully with ID: ${this.lastID}`;
        order_info.orderItems.forEach((item) => {
            // Validate product fields (name, price, quantity)
            if (item.productName == "") {
                console.log(`Skipping product due to missing fields: ${JSON.stringify(item)}`);
                return;
            } else {
                // Insert valid item into the database
                db.run(
                    "INSERT INTO orderItems (productName, unit, quantity, price, productOrderId) VALUES (?, ?, ?, ?, ?)",
                    [item.productName, item.unit, item.quantity, item.price, this.lastID],
                    function (err) {
                        if (err) {
                            console.error("Error inserting product:", err);
                        } else {
                            console.log(`Product inserted: ${item.productName}`);
                        }
                    }
                );
            }
        });
        // Send response back after processing
        res.end(JSON.stringify({ done: true }));
    });
});

app.post("/addItems", (req, res) => {
    let item_info = req.body.storageItems;

    db.run(
        "INSERT INTO storageItems (itemNum, itemName, Availability, storageType, type, position) VALUES (?, ?, ?, ?, ?, ?)",
        [item_info.itemNum, item_info.itemName, item_info.Availability, item_info.storageType, item_info.type, item_info.position],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting item");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

app.post("/addOrderItems", (req, res) => {
    let order_item_info = req.body.orderItems;

    db.run(
        "INSERT INTO orderItems (productName, unit, quantity, price) VALUES ( ?, ?, ?, ?)",
        [order_item_info.productName, order_item_info.unit, order_item_info.quantity, order_item_info.price],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting item");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

app.post("/addStorage", (req, res) => {
    let storage_info = req.body.storageName;

    db.run("INSERT INTO storage (storageName) VALUES (?)", [storage_info.storageName], function (err) {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).send("Error inserting invoice");
        }

        `Data inserted successfully with ID: ${this.lastID}`;

        // Send response back after processing
        res.end(JSON.stringify({ done: true }));
    });
});

app.post("/addAutomaticInvoicesProduct", (req, res) => {
    let autoInvoice_info = req.body.automaticInvoice;

    db.run(
        "INSERT INTO automaticInvoices (client, clientId, dateOfMonth, price, typeOfPayment, unpaid) VALUES (?, ?, ?, ?, ?, ?)",
        [
            autoInvoice_info.client,
            this.lastID,
            autoInvoice_info.dateOfMonth,
            autoInvoice_info.price,
            autoInvoice_info.typeOfPayment,
            autoInvoice_info.unpaid,
        ],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting order");
            }

            `Data inserted successfully with ID: ${this.lastID}`;
            autoInvoice_info.products.forEach((item) => {
                // Validate product fields (name, price, quantity)
                if (item.productName == "") {
                    console.log(`Skipping product due to missing fields: ${JSON.stringify(item)}`);
                    return;
                } else {
                    // Insert valid item into the database
                    db.run(
                        "INSERT INTO automaticInvoicesProducts (productId, productName, unit, quantity, price) VALUES (?, ?, ?, ?, ?)",
                        [this.lastID, item.productName, item.unit, item.quantity, item.price],
                        function (err) {
                            if (err) {
                                console.error("Error inserting product:", err);
                            } else {
                                console.log(`Product inserted: ${item.productName}`);
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

app.post("/addAutomaticInvoicesProduct", (req, res) => {
    let autoInvoice_info = req.body.automaticInvoices;

    db.run(
        "INSERT INTO automaticInvoicesProducts (productId, productName, unit, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [autoInvoice_info.productId, autoInvoice_info.productName, autoInvoice_info.unit, autoInvoice_info.quantity, autoInvoice_info.price],
        function (err) {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).send("Error inserting item");
            }

            console.log(`Data inserted successfully with ID: ${this.lastID}`);

            // Send response back after processing
            res.end(JSON.stringify({ done: true }));
        }
    );
});

/* DELETE FUNCTIONS */
app.delete("/deleteIncomingInvoices", (req, res) => {
    db.all("DELETE FROM incomingInvoices WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ done: true }));
    });
});

app.delete("/deleteOutgoingInvoices", (req, res) => {
    db.all("DELETE FROM outgoingInvoices WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        res.end(JSON.stringify({ done: true }));
    });
});

app.delete("/deleteAutoInvoice", (req, res) => {
    db.all("DELETE FROM automaticInvoices WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        db.all("DELETE FROM automaticInvoicesProducts WHERE productId = '" + req.query.id + "'", [], (err, rows) => {
            res.end(JSON.stringify({ done: true }));
        });
    });
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

app.delete("/deleteOrder", (req, res) => {
    db.all("DELETE FROM orders WHERE uid = '" + req.query.id + "'", [], (err, rows) => {
        db.all("DELETE FROM orderItems WHERE productOrderId = '" + req.query.id + "'", [], (err, rows) => {
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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
