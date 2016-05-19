/* Datastore schema
    Process: { _id, attributeNames: [] }
    Node:    { _id, parentID, processName }
    Sample:  { _id: { NodeID, SampleID }, attributes: [] }
*/

var db;

function createDummyDatastore() {
    db = new Nedb(); // in-memory

    // insert processes
    db.insert({ _id: "rootProcess", attributeNames: ["mass (mg)"] });
    db.insert({ _id: "DNA Extract", attributeNames: ["Date Extracted", "Kit", "Elution mL", "DNA ng", "Notes"] });
    
    // insert nodes
    db.insert({ _id: "rootNode", parentID: null, processName: "rootProcess" });
    db.insert({ _id: "node2", parentID: "rootNode", processName: "DNA Extract" });
    
    // insert samples
    db.insert({ _id: { nodeID: "rootNode", sampleID: "1" }, attributes: ["50"] });
    db.insert({ _id: { nodeID: "rootNode", sampleID: "2" }, attributes: ["55"] });
    db.insert({ _id: { nodeID: "rootNode", sampleID: "3" }, attributes: ["80"] });
    db.insert({ _id: { nodeID: "rootNode", sampleID: "4" }, attributes: ["60"] });
    db.insert({ _id: { nodeID: "node2", sampleID: "1" }, attributes: ["12/3", "Qiagen", "160", "12", ""] });
    db.insert({ _id: { nodeID: "node2", sampleID: "1" }, attributes: ["12/3", "Qiagen", "160", "18", ""] });
    db.insert({ _id: { nodeID: "node2", sampleID: "1" }, attributes: ["12/3", "Qiagen", "80", "10", "Second elution failed, so only 80mL"] });
}

// return all non-root nodes as an array of documents
function getAllNonRootNodes(fn) {
    db.find({ parentID: { $exists: true }, nodeID: { $ne: "rootNode" } }, { parentID: 1, processName: 1 }, returnDocs);
}

// return all samples with nodeID
function getNodeSamples(nodeID, fn) {
    db.find({ "_id.nodeID": nodeID }, returnDocs);
}

var returnDocs = function (err, docs) {
    if (typeof(fn) === 'function') {
        fn(docs);
    }
}
