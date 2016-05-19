/* Data structure
    Process: { _id, attributeNames: [] }
    Node:    { _id, parentID, processName }
    Sample:  { _id: { NodeID, SampleID }, attributes: [] }
*/

//var Datastore = require('nedb')
var db, selectedNode = null;

$("#newProjectButton").click(function() {
    createDatastore($("#filenameField").val());
    refreshNodeTable();
});

$("#showSamplesButton").click(function() {
    refreshSampleTable($("#nodeIDField1").val());
});

$("#createAttributeNameButton").click(function() {
    createAttributeName("rootNode", $("#attributeNameField1").val());
    refreshSampleTable(selectedNode);
});

$("#deleteAttribute").click(function() {
    deleteAttribute("rootNode", $("#attributeNameField").val());
    refreshSampleTable(selectedNode);
});

$("#insertSampleIDButton").click(function() {
    insertSampleID("rootNode", $("#sampleIDField1").val());
    refreshSampleTable(selectedNode);
});

$("#removeSampleButton").click(function() {
    removeSample("rootNode", $("#sampleIDField1").val());
    refreshSampleTable(selectedNode);
});

$("#processButton").click(function() {
    console.log(process($("#nodeIDField2").val(), $("#sampleIDField3").val(),
            $("#processNameField").val(), $("#processAttributeNameField").val()));
    //refreshNodeTable();
});

$("#deleteNodeButton").click(function() {
   deleteNode($("#nodeID2Field").val());
   refreshNodeTable();
   refreshSampleTable(selectedNode);
});

function createDatastore(name) {
	//db = new Datastore({ filename: name, autoload: true }); // persistent
    db = new Nedb(); // in-memory

    // insert root node
    db.insert({ _id: "rootProcess", attributeNames: [] });
    db.insert({ _id: "rootNode", parentID: null, processName: "rootProcess" });
}

function createAttributeName(nodeID, attributeName) {

    // add attribute to process attributes
    db.findOne({ _id: nodeID }, function (err, doc1) {
        db.update({ _id: doc1.processName }, { $push: { attributeNames: attributeName } }, {});
    });
}

function deleteAttribute(nodeID, attributeName) {
    var attributeIndex;
    
    db.findOne({ _id: nodeID }, function (err, doc1) {
	
        // delete attribute from process attributes
        db.findOne({ _id: doc1.processName }, function (err, doc2) {
            for (i=0; i<doc2.attributes.length; i++) {
                if (doc2.attributes[i] == attributeName) {
                    doc2.attributes.splice(i, i+1);
                    attributeIndex = i;
                }
            }
        });

        // delete all attributes of all samples with attributeName
        db.find({ processName: doc1.processName }, function (err, docs1) {
            for (i=0; i<docs1.length; i++) {
                db.update({ "_id.nodeID": docs1[i]._id }, { attributes: attributes.splice(attributeIndex, attributeIndex+1) }, {});
            }
        });
    });
}

function insertSampleID(nodeID, sampleID) {
    try {
        db.insert( { _id: { nodeID: nodeID, sampleID: sampleID } }, function callback(err, newDoc) {
            // if id in use, update description
            if (err) {
                alert("This ID already exists!");
            }
        });
    } catch(err) {
        alert("No project opened!");
    }
}

function insertSample(sampleID, description) {
    try {
        var record = {
            _id: { nodeID: "root", sampleID: sampleID }, // primary key is (nodeID, sampleID)
            description: description
        };
        db.insert(record, function callback(err, newDoc) {
            // if id in use, update description
            if (err) {
                db.update({ _id: { nodeID: "root", sampleID: sampleID } }, { description: description }, {});
            }
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
            }
        });
    } catch(err) {
        alert("No project opened!");
    }
}

function process(nodeID, sampleID, processName, processAttributeName) {
    var returnID;
	try {
        db.findOne({ _id: nodeID }, function (err, parentNodeDoc) {
            if (parentNodeDoc == null) {
                alert("This node does not exist!");
            } else {
                db.findOne({ "_id.sampleID": sampleID }, function (err, sampleDoc) {
                    if (sampleDoc == null) {
                        alert("This sample does not exist!");
                    } else {
                         
                        // add node
                        db.insert({ parentID: nodeID, processName: processName }, function(err, newNodeDoc) {
                        
                            // add sample
                            insertSampleID(newNodeDoc._id, sampleID); // one sample for now
                                
                            // add process
                            db.insert({ _id: processName, attributeNames: [processAttributeName] }, function (processErr, newProcessDoc) {
                                
                                // add attributeName
                                if (processErr) {
                                    db.findOne({ _id: processName }, function (err, existingProcessDoc) {
                                        createAttributeName(newNodeDoc._id, existingProcessDoc.attributeNames[0]); // one attributeName for now
                                    });
                                } else {
                                    createAttributeName(newNodeDoc._id, processAttributeName);
                                }
                            });
                            returnID = newNodeDoc._id;
							console.log("1: "+returnID);
                        });
						console.log("2: "+returnID);
                    }
					console.log("3: "+returnID);
                });
				console.log("4: "+returnID);
            }
			console.log("5: "+returnID);
        });
		console.log("6: "+returnID);
    } catch(err) {
        alert("No project opened!");
    }
	return returnID;
}

function deleteNode(nodeID) {
    try {
        // delete node with nodeID
        db.remove({ _id: nodeID }, {}, function (err, numRemoved) {
            if (numRemoved == 0) {
                alert("There is no node with this ID!");
            } else {
                selectedNode = null;
            }
        });

        // delete all sample docs with nodeID
        db.remove({ _id: { nodeID: nodeID } }, { multi: true });

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
                var cell2 = row.insertCell(2);
                row.id = docs[i]._id;
                cell1.innerHTML = docs[i]._id;
                cell2.innerHTML = docs[i].parentID;
                cell2.innerHTML = docs[i].processName;
            }
        });
    } catch(err) {
        alert("No project opened!");
    }
}

function refreshSampleTable(nodeID) {
    try {
        db.findOne({ _id: nodeID }, function (err, doc1) {
            if (doc1 == null) {
                alert("No nodes with this ID!");
            } else {
                // remove all non-header rows
                var table = document.getElementById("samplesTable");
                table.getElementsByTagName("tbody")[0].innerHTML = table.rows[0].innerHTML;

                // remove all header cells except first
                for (i=1; i<table.rows[0].cells.length; i++) {
                    table.rows[0].deleteCell(i);
                }

                // insert header cells
                db.findOne({ _id: doc1.processName }, function (err, doc2) {
                    var row = table.rows[0];
                    for (i=0; i<doc2.attributeNames.length; i++) {
                        row.insertCell(i+1).innerHTML = doc2.attributeNames[i];
                    }
                });

                // insert all sample docs with nodeID as rows into table
                db.find({ "_id.nodeID": nodeID }, function (err, docs) {

                    // insert "No samples!" if no sample docs found
                    if (docs.length == 0) {
                        var row = table.insertRow(1);
                        var cell1 = row.insertCell(0);
                        cell1.innerHTML = "No samples!";
                    }
                    
                    // insert sample data
                    for (i=0; i<docs.length; i++) {
                        var row = table.insertRow(1);
                        row.insertCell(0).innerHTML = docs[i]._id.sampleID;
                        if (typeof docs[i].attributes !== 'undefined') {
                            for (j=0; j<docs[i].attributes.length; j++) {
                                row.insertCell(j+1).innerHTML = docs[i].attributes[j];
                            }
                        }
                    }
                });
                selectedNode = nodeID;
            }
        });
    } catch(err) {
        console.log(err);
        alert("No project opened!");
    }
}
