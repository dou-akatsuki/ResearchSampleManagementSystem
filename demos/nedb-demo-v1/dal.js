var db, selectedNode = null;

function createDatastore() {
    db = new Nedb(); // in-memory

    // insert root node
    db.insert({ _id: "root", parentID: null });
    refreshNodeTable();
}

function addNode(parentID) {
    try {
        var inserted = false;

        // add node if node with parentID exists
        db.find({ parentID: { $exists: true } }, function (err, docs) {
            for (i=0; i<docs.length; i++) {
                if (parentID == docs[i]._id) {
                    db.insert({ parentID: parentID })
                    inserted = true;
                    refreshNodeTable();
                }
            }
            if (!inserted) {
                alert("This parent does not exist!");
            }
        });
    } catch(err) {
        alert("No project opened!");
    }
}

function deleteNode(nodeID) {
    try {
        // delete node with nodeID
        db.remove({ _id: nodeID }, {}, function (err, numRemoved) {
            if (numRemoved == 0) {
                alert("There is no node with this ID!");
            } else {
                selectedNode = null;
                refreshNodeTable();
            }
        });

        // delete all sample docs with nodeID
        db.remove({ _id: { nodeID: nodeID } }, { multi: true });
        refreshSampleTable(selectedNode);

        // delete child nodes
        db.find({ parentID: { $exists: true } }, function (err, docs) {
            for (i=0; i<docs.length; i++) {
                if (nodeID == docs[i].parentID) {
                    deleteNode(docs[i]._id);
                }
            }
        });
    } catch(err) {
        alert("No project opened!");
    }
}

function insertSample(sampleID, description) {
    try {
        var record = {
            _id: { nodeID: selectedNode, sampleID: sampleID }, // primary key is (nodeID, sampleID)
            description: description
        };
        db.insert(record, function callback(err, newDoc) {
            // if id in use, update description
            if (err) {
                db.update({ _id: { nodeID: selectedNode, sampleID: sampleID } }, { description: description }, {});
            }
            refreshSampleTable(selectedNode);
        });
    } catch(err) {
        alert("No project opened!");
    }
}

function removeSample(sampleID) {
    try {
        db.remove({ _id: { nodeID: selectedNode, sampleID: sampleID } }, {}, function (err, numRemoved) {
            if (numRemoved == 0) {
                alert("There is no node with this ID!");
            } else {
                refreshSampleTable(selectedNode);
            }
        });
    } catch(err) {
        alert("No project opened!");
    }
}

function refreshNodeTable() {
    try {
        // remove all rows from table
        var table = document.getElementById("nodesTable");
        table.getElementsByTagName("tbody")[0].innerHTML = table.rows[0].innerHTML;

        // insert all node docs as rows into table
        db.find({ parentID: { $exists: true } }, function (err, docs) {
            for (i=0; i<docs.length; i++) {
                var row = table.insertRow(1);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                row.id = docs[i]._id;
                cell1.innerHTML = docs[i]._id;
                cell2.innerHTML = docs[i].parentID;
            }
        });
    } catch(err) {
        alert("No project opened!");
    }
}

function refreshSampleTable(nodeID) {
    try {
        var anySamples = false, nodeExists = true;

        // check if node with nodeID exists
        db.findOne({ _id: nodeID }, function (err, doc) {
            if (doc == null) {
                nodeExists = false;
                alert("No nodes with this ID!");
            }
        });

        if (nodeExists) {
            // remove all rows from table
            var table = document.getElementById("samplesTable");
            table.getElementsByTagName("tbody")[0].innerHTML = table.rows[0].innerHTML;

            // insert all sample docs with nodeID as rows into table
            db.find({ "_id.nodeID": nodeID }, function (err, docs) {
                for(i=0; i<docs.length; i++) {
                    var row = table.insertRow(1);
                    var cell1 = row.insertCell(0);
                    var cell2 = row.insertCell(1);
                    row.id = docs[i]._id;
                    cell1.innerHTML = docs[i]._id.sampleID;
                    cell2.innerHTML = docs[i].description;
                    anySamples = true;
                }

                // insert "no samples" if no sample docs found
                if (!anySamples) {
                    var row = table.insertRow(1);
                    var cell1 = row.insertCell(0);
                    var cell2 = row.insertCell(1);
                    //row.id = docs[i]._id;
                    cell1.innerHTML = "No";
                    cell2.innerHTML = "Samples";
                }
            });
            selectedNode = nodeID;
        }

        if (selectedNode == null) {
            // remove all rows from table
            var table = document.getElementById("samplesTable");
            table.getElementsByTagName("tbody")[0].innerHTML = table.rows[0].innerHTML;
        }
    } catch(err) {
        alert("No project opened!");
    }
}
