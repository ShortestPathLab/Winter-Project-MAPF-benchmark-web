import { mail } from "mail";
import mongoose from "mongoose";
import db from "../models/index";
import { RequestHandler } from "express";
import date from "date-and-time";

const Algorithm = db.algorithms;
const Instance = db.instances;
const Solution_path = db.solution_paths;
const Map = db.maps;
const Scenario = db.scenarios;
const Submission = db.submissions;
const Request = db.requests;

export const sendMail: RequestHandler = (req, res) => {
  console.log("in sendding maillllllllllll");
  const request_email = req.body.requesterEmail;
  const request_name = req.body.requesterName;
  const { status } = req.body;
  const { comments } = req.body;
  let subjectText = `Dear ${request_name},\nHope this email finds you well. Our team has reviewed your request and here is your request status:\n\nStatus: ${status}\nComments: ${comments}`;

  if (status === "Approved") {
    const apiKey = req.body.api_key;
    subjectText += `\n\nYour API key is: ${apiKey}`;
  } else {
    subjectText += `\n\nUnfortunately, your request was not approved. Please review the comments and submit your request again with the correct information.`;
  }
  mail(
    "noreply@pathfinding.ai",
    request_email,
    "Submission Request Status",
    subjectText
  );
};

export const findSubmittedAlgoByID: RequestHandler = (req, res) => {
  const { id } = req.params;
  Algorithm.find({ user_id: id }, {})
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving tutorials.",
      });
    });
};

export const updateAlgoByID: RequestHandler = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const { id } = req.params;
  Algorithm.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update Algorithm with id=${id}. Maybe  Algorithm was not found!`,
        });
      } else res.send({ message: " Algorithm was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send({
        message: `Error updating  Algorithm with id=${id}`,
      });
    });
};

export const checkAlgoExist: RequestHandler = (req, res) => {
  console.log("here");
  console.log(req.params.id);
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }
  console.log("here");
  const { id } = req.params;
  if (id === "-1") {
    Algorithm.findOne({ algo_name: req.body.algo_name })
      .then((data) => {
        if (data === null) {
          res.status(200).send({
            message: "valid name",
          });
        } else {
          res.status(404).send({
            message: `Cannot update Algorithm with id=${id}. Maybe  Algorithm was not found!`,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({
          message: err,
        });
      });
  } else {
    Algorithm.findOne({ _id: { $ne: id }, algo_name: req.body.algo_name })
      .then((data) => {
        if (data === null) {
          res.status(200).send({
            message: "valid name",
          });
        } else {
          res.status(404).send({
            message: `Cannot update Algorithm with id=${id}. Maybe  Algorithm was not found!`,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({
          message: err,
        });
      });
  }
};

export const createAlgo: RequestHandler = (req, res) => {
  if (!req.body.algo_name) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }
  const algo = new Algorithm({
    algo_name: req.body.algo_name,
    authors: req.body.authors,
    papers: req.body.papers,
    github: req.body.github,
    comments: req.body.comments,
    user_id: req.body.user_id,
    best_lower: 0,
    best_solution: 0,
    instances_closed: 0,
  });
  console.log(algo);
  algo
    .save(algo)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Algorithm.",
      });
    });
};

export const getMapSubmittedInfo: RequestHandler = (req, res) => {
  const id = new mongoose.Types.ObjectId(req.params.id);
  const query1 = Map.find({}).catch((err) => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Algorithm.",
    });
  });

  const query2 = Submission.aggregate([
    { $match: { algo_id: id, best_lower: true } },
    {
      $group: {
        _id: { map_id: "$map_id" },
        count: { $count: {} },
      },
    },
  ]).catch((err) => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Algorithm.",
    });
  });

  const query3 = Submission.aggregate([
    { $match: { algo_id: id, best_solution: true } },
    {
      $group: {
        _id: { map_id: "$map_id" },
        count: { $count: {} },
      },
    },
  ]).catch((err) => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Algorithm.",
    });
  });

  const query4 = Submission.aggregate([
    { $match: { algo_id: id, $expr: { $ne: ["$solution_cost", null] } } },
    {
      $group: {
        _id: { map_id: "$map_id" },
        count: { $count: {} },
      },
    },
  ]).catch((err) => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Algorithm.",
    });
  });

  const query5 = Submission.aggregate([
    {
      $match: {
        algo_id: id,
        $expr: { $eq: ["$lower_cost", "$solution_cost"] },
      },
    },
    {
      $group: {
        _id: { map_id: "$map_id" },
        count: { $count: {} },
      },
    },
  ]).catch((err) => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Algorithm.",
    });
  });
  Promise.all([query1, query2, query3, query4, query5])
    .then((result) => {
      const map_info = {};
      result[0].forEach((element) => {
        map_info[element.id] = {};
        map_info[element.id].map_name = element.map_name;
        map_info[element.id].map_size = element.map_size;
        map_info[element.id].map_type = element.map_type;
        map_info[element.id].scens = element.scens;
        map_info[element.id].instances = element.instances;
        map_info[element.id].best_solution = 0;
        map_info[element.id].best_lower = 0;
        map_info[element.id].closed = 0;
        map_info[element.id].solved = 0;
      });
      result[1].forEach((element) => {
        map_info[element._id.map_id].best_lower = element.count;
      });
      result[2].forEach((element) => {
        map_info[element._id.map_id].best_solution = element.count;
      });
      result[3].forEach((element) => {
        map_info[element._id.map_id].solved = element.count;
      });
      result[4].forEach((element) => {
        map_info[element._id.map_id].closed = element.count;
      });
      const final_results = [];
      for (const key in map_info) {
        final_results.push(map_info[key]);
      }
      res.send(final_results);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred.",
      });
    });
};

export const submitData = async (req, res) => {
  const algo_id = new mongoose.Types.ObjectId(req.params.id);
  if (!req.body) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }
  const algo = await Algorithm.findOne({ _id: algo_id }).catch((err) => {
    res.status(400).send({
      message: err.message || "Some error occurred while finding algorithm.",
    });
  });
  if (!algo) {
    res.status(400).send({ message: "Error: algorithm not found" });
    return;
  }
  const { algo_name } = algo;
  const map = await Map.findOne({ map_name: req.body[0].map_name }).catch(
    (err) => {
      res.status(400).send({
        message: err.message || "Some error occurred while finding map.",
      });
    }
  );
  if (!map) {
    res.status(400).send({ message: "Error: map not found" });
    return;
  }
  const map_id = map._id;
  for (const index in req.body) {
    const scen = await Scenario.findOne({
      map_id,
      scen_type: req.body[index].scen_type,
      type_id: parseInt(req.body[index].type_id),
    }).catch((err) => {
      res.status(400).send({
        message: err.message || "Some error occurred while finding scenario.",
      });
    });
    if (!scen) {
      res.status(400).send({ message: "Error: scenario not found" });
      return;
    }
    const scen_id = scen._id;
    const curr_instance = await Instance.findOne({
      map_id,
      scen_id,
      agents: parseInt(req.body[index].agents),
    }).catch((err) => {
      res.status(400).send({
        message: err.message || "Some error occurred while finding instance.",
      });
    });
    if (!curr_instance) {
      res.status(400).send({ message: "Error: instance not found" });
      return;
    }
    const instance_id = curr_instance._id;
    const curr_submission = {
      map_id,
      instance_id,
      algo_id,
      lower_cost:
        req.body[index].lower_cost === ""
          ? null
          : parseInt(req.body[index].lower_cost),
      solution_cost:
        req.body[index].solution_cost === ""
          ? null
          : parseInt(req.body[index].solution_cost),
      best_lower: false,
      best_solution: false,
      date: date.format(new Date(), "YYYY-MM-DD"),
      agents: parseInt(req.body[index].agents),
      scen_id,
    };
    const path = req.body[index].solution_plan;
    if (curr_submission.lower_cost !== null) {
      if (curr_instance.lower_cost !== null) {
        if (curr_instance.lower_cost > curr_submission.lower_cost) {
          console.log("erase preivous record");
        }
      }
      if (curr_instance.lower_cost === null) {
        curr_submission.best_lower = true;
        curr_instance.lower_cost = curr_submission.lower_cost;
        curr_instance.lower_date = curr_submission.date;
        curr_instance.empty = false;
        curr_instance.lower_algos.push({
          algo_name,
          algo_id: curr_submission.algo_id,
          date: curr_submission.date,
        });
      } else {
        if (curr_instance.lower_cost < curr_submission.lower_cost) {
          await Submission.updateMany(
            { instance_id },
            {
              $set: {
                best_lower: false,
              },
            }
          ).catch((err) => {
            res.status(400).send({
              message:
                err.message ||
                "Some error occurred while updating lower-bound.",
            });
          });

          curr_submission.best_lower = true;
          curr_instance.lower_cost = curr_submission.lower_cost;
          curr_instance.lower_date = curr_submission.date;
          curr_instance.empty = false;
          curr_instance.lower_algos = [
            {
              algo_name,
              algo_id: curr_submission.algo_id,
              date: curr_submission.date,
            },
          ];
        } else if (curr_instance.lower_cost === curr_submission.lower_cost) {
          curr_submission.best_lower = true;
          let record_exist = false;
          let earliest_date = "2222-10-10";
          for (let i = 0; i < curr_instance.lower_algos.length; i++) {
            if (
              curr_instance.lower_algos[i].algo_id.equals(
                curr_submission.algo_id
              )
            ) {
              curr_instance.lower_algos[i].date = curr_submission.date;
              record_exist = true;
            }
            earliest_date =
              earliest_date < curr_instance.lower_algos[i].date
                ? earliest_date
                : curr_instance.lower_algos[i].date;
          }
          if (record_exist) {
            curr_instance.lower_date = earliest_date;
            curr_instance.empty = false;
          } else {
            curr_instance.lower_algos.push({
              algo_name,
              algo_id: curr_submission.algo_id,
              date: curr_submission.date,
            });
          }
        }
      }
    }

    if (curr_submission.solution_cost !== null) {
      if (curr_instance.solution_cost === null) {
        let path_id = null;
        await Solution_path.collection
          .insertOne({ instance_id, solution_path: path })
          .then((result) => {
            path_id = result.insertedId;
          })
          .catch((err) => {
            res.status(400).send({
              message:
                err.message || "Some error occurred while updating solution.",
            });
          });
        curr_submission.best_solution = true;
        curr_instance.solution_cost = curr_submission.solution_cost;
        curr_instance.solution_date = curr_submission.date;
        curr_instance.solution_path_id = path_id;
        curr_instance.empty = false;
        curr_instance.solution_algos.push({
          algo_name,
          algo_id: curr_submission.algo_id,
          date: curr_submission.date,
        });
      } else {
        if (curr_instance.solution_cost > curr_submission.solution_cost) {
          await Submission.updateMany(
            { instance_id },
            {
              $set: {
                best_solution: false,
              },
            }
          ).catch((err) => {
            res.status(400).send({
              message:
                err.message || "Some error occurred while updating solution.",
            });
          });
          let path_id = null;
          await Solution_path.collection
            .insertOne({ instance_id, solution_path: path })
            .then((result) => {
              path_id = result.insertedId;
            })
            .catch((err) => {
              res.status(400).send({
                message:
                  err.message || "Some error occurred while updating solution.",
              });
            });
          curr_submission.best_solution = true;
          curr_instance.solution_cost = curr_submission.solution_cost;
          curr_instance.solution_date = curr_submission.date;
          curr_instance.solution_path_id = path_id;
          curr_instance.solution_algos = [
            {
              algo_name,
              algo_id: curr_submission.algo_id,
              date: curr_submission.date,
            },
          ];
          curr_instance.empty = false;
        } else if (
          curr_instance.solution_cost === curr_submission.solution_cost
        ) {
          curr_submission.best_solution = true;
          let record_exist = false;
          let earliest_date = "2222-10-10";
          for (let i = 0; i < curr_instance.solution_algos.length; i++) {
            if (
              curr_instance.solution_algos[i].algo_id.equals(
                curr_submission.algo_id
              )
            ) {
              curr_instance.solution_algos[i].date = curr_submission.date;
              record_exist = true;
            }
            earliest_date =
              earliest_date < curr_instance.solution_algos[i].date
                ? earliest_date
                : curr_instance.solution_algos[i].date;
          }
          if (record_exist) {
            curr_instance.solution_date = earliest_date;
            curr_instance.empty = false;
          } else {
            curr_instance.solution_algos.push({
              algo_name,
              algo_id: curr_submission.algo_id,
              date: curr_submission.date,
            });
          }
        }
      }
    }

    if (
      curr_instance.lower_cost !== null &&
      curr_instance.solution_cost !== null
    ) {
      if (curr_instance.lower_cost === curr_instance.solution_cost) {
        curr_instance.closed = true;
      }
    }

    let mongo_update = await Instance.updateOne(
      { _id: instance_id },
      curr_instance
    ).catch((err) => {
      res.status(400).send({
        message: err.message || "Some error occurred while updating instance.",
      });
    });

    mongo_update = await Submission.updateOne(
      {
        map_id: curr_submission.map_id,
        instance_id: curr_submission.instance_id,
        algo_id: curr_submission.algo_id,
      },
      curr_submission,
      { upsert: true }
    ).catch((err) => {
      res.status(400).send({
        message:
          err.message || "Some error occurred while updating submission.",
      });
    });
  }
  return res.status(200).send({ message: "Update successful" });
};

export const updateProgress = async (req, res) => {
  const algo_id = new mongoose.Types.ObjectId(req.params.id);
  if (!req.body) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }
  const algo = await Algorithm.findOne({ _id: algo_id }).catch((err) => {
    res.status(400).send({
      message: err.message || "Some error occurred while finding algorithm.",
    });
  });
  if (!algo) {
    res.status(400).send({ message: "Error: algorithm not found" });
    return;
  }
  const map = await Map.findOne({ map_name: req.body.map_name }).catch(
    (err) => {
      res.status(400).send({
        message: err.message || "Some error occurred while finding map.",
      });
    }
  );
  if (!map) {
    res.status(400).send({ message: "Error: map not found" });
    return;
  }
  const map_id = map._id;
  const scen_type = ["even", "random"];
  let total_s = 0;
  let total_l = 0;
  for (let i = 1; i < 26; i++) {
    for (const scen_t of scen_type) {
      const scen = await Scenario.findOne({
        map_id,
        type_id: i,
        scen_type: scen_t,
      }).catch((err) => {
        res.status(400).send({
          message: err.message || "Some error occurred while finding scenario.",
        });
      });
      if (!scen) {
        res.status(400).send({ message: "Error: scenario not found" });
        return;
      }
      const scen_id = scen._id;

      const num_s = await Instance.countDocuments({
        scen_id,
        closed: true,
      }).catch((err) => {
        res.status(400).send({
          message:
            err.message || "Some error occurred while counting document.",
        });
      });
      const num_l = await Instance.countDocuments({
        scen_id,
        solution_cost: { $ne: null },
      }).catch((err) => {
        res.status(400).send({
          message:
            err.message || "Some error occurred while counting document.",
        });
      });
      total_s = total_s + num_s;
      total_l = total_l + num_l;
      await Scenario.updateOne(
        { _id: scen_id },
        {
          $set: {
            instances_closed: num_s,
            instances_solved: num_l,
          },
        }
      ).catch((err) => {
        res.status(400).send({
          message:
            err.message || "Some error occurred while updating scenario.",
        });
      });
    }
  }
  await Map.updateOne(
    { _id: map_id },
    {
      $set: {
        instances_closed: total_s,
        instances_solved: total_l,
      },
    }
  ).catch((err) => {
    res.status(400).send({
      message: err.message || "Some error occurred while updating map.",
    });
  });
  const lower = await Submission.countDocuments({
    algo_id,
    best_lower: true,
  }).catch((err) => {
    res.status(400).send({
      message: err.message || "Some error occurred while counting document.",
    });
  });
  const solution = await Submission.countDocuments({
    algo_id,
    best_solution: true,
  }).catch((err) => {
    res.status(400).send({
      message: err.message || "Some error occurred while counting document.",
    });
  });
  const closed = await Submission.countDocuments({
    algo_id,
    $expr: { $eq: ["$lower_cost", "$solution_cost"] },
  }).catch((err) => {
    res.status(400).send({
      message: err.message || "Some error occurred while counting document.",
    });
  });
  const solved = await Submission.countDocuments({
    algo_id,
    $expr: { $ne: ["$solution_cost", null] },
  }).catch((err) => {
    res.status(400).send({
      message: err.message || "Some error occurred while counting document.",
    });
  });
  await Algorithm.updateOne(
    { _id: algo_id },
    {
      $set: {
        best_lower: lower,
        best_solution: solution,
        instances_closed: closed,
        instances_solved: solved,
      },
    }
  ).catch((err) => {
    res.status(400).send({
      message: err.message || "Some error occurred while updating algorithm.",
    });
  });
  return res.status(200).send({ message: "Update successful" });
};
