const db = require("../models");
const mongoose = require("mongoose");
const Request = db.requests;
const Submission_key = db.submission_keys;
const crypto = require('crypto');

exports.findAll = (req, res) => {
    Request.find({})
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving request."
            });
        });
};


// Find a single Tutorial with an id
exports.findByInstance_id = (req, res) => {
    const id = req.params.id;

    Request.findById(id)
        .then(data => {
            if (!data)
                res.status(404).send({ message: "Not found request with id " + id });
            else res.send(data);
        })
        .catch(err => {
            res
                .status(500)
                .send({ message: "Error retrieving request with id=" + id });
        });
};

exports.create = async (req, res) => {
    if (!req.body.requesterName) {
      return res.status(400).send({ message: "Requester name can not be empty!" });
    }
    const request = new Request({
      requesterName: req.body.requesterName,
      requesterEmail: req.body.requesterEmail,
      requesterAffilation: req.body.requesterAffilation,
      googleScholar: req.body.googleScholar,
      dblp: req.body.dblp,
      justification: req.body.justification,
      algorithmName: req.body.algorithmName,
      authorName: req.body.authorName,
      paperReference: req.body.paperReference,
      githubLink: req.body.githubLink,
      comments: req.body.comments,
    });

    request.save(request)
    .then(data => {
        res.send(data);
    })
    .catch(err => {
        res.status(500).send({
            message:
                err.message || "Some error occurred while creating the Requester."
        });
    });


  };

exports.updateRequest = async (req, res) =>{
const { id } = req.params;
const { reviewStatus, ...otherFields } = req.body;
try {

    const request = await Request.findById(id);
    console.log(request)
    if (!request){
        return res.status(404).send({ message: `Request with id ${id} not found` });
    }

    const previousStatus = request.reviewStatus.status;

    const updatedRequest = await Request.findByIdAndUpdate(
        id, {reviewStatus, ...otherFields}, {new:true}
    );

    // request was reviewed and approved
    if (previousStatus === "Not Reviewed" && reviewStatus.status ==="Approved" ){
        console.log('innnnnn here')
        // generate new submission key api for the user
        const apiKey = crypto.randomBytes(16).toString('hex');
        const creationDate = new Date();
        const expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + 1); // API key valid for one month
        const submission_key = new Submission_key({
          request_id : id,
          api_key : apiKey,
          creationDate : creationDate, 
          expirationDate : expirationDate
        });
        console.log(submission_key)

        submission_key.save(submission_key)
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the submission key."
            });
        });
    }
    res.send({ message: "Request updated successfully", updatedRequest });
}
catch (err){
    res.status(500).send({ message: err.message || "Some error occurred while updating the request." });
}

};