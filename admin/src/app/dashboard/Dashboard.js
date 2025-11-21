import React, { Component } from 'react';

export class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      students: 0,
      tutorials: 0,
      admins: 0,
    };
  }

  componentDidMount() {
    // 🔹 Adjust the URL to your backend
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        this.setState({
          students: data.students,
          tutorials: data.tutorials,
          admins: data.admins,
          topicCount:data.topicCount
        });
      })
      .catch((err) => console.error("Error fetching dashboard stats:", err));
  }

  render() {
    return (
      <div className="container mt-4">
        <div className="page-header">
          <h3 className="page-title">
            <span className="page-title-icon bg-gradient-primary text-white mr-2">
              <i className="mdi mdi-home"></i>
            </span>
            Dashboard
          </h3>
        </div>

        {/* Summary Cards (Students, Tutorials, Admins) */}
        <div className="row">
          <div className="col-md-4 stretch-card grid-margin">
            <div className="card bg-gradient-danger card-img-holder text-white">
              <div className="card-body">
                <img
                  src={require("../../assets/images/dashboard/circle.svg")}
                  className="card-img-absolute"
                  alt="circle"
                />
                <h4 className="font-weight-normal mb-3">
                  Number of Students{" "}
                  <i className="mdi mdi-chart-line mdi-24px float-right"></i>
                </h4>
                <h2 className="mb-5">{this.state.students}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4 stretch-card grid-margin">
            <div className="card bg-gradient-info card-img-holder text-white">
              <div className="card-body">
                <img
                  src={require("../../assets/images/dashboard/circle.svg")}
                  className="card-img-absolute"
                  alt="circle"
                />
                <h4 className="font-weight-normal mb-3">
                  Tutorials Topics{" "}
                  <i className="mdi mdi-bookmark-outline mdi-24px float-right"></i>
                </h4>
                <h2 className="mb-5">{this.state.topicCount}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4 stretch-card grid-margin">
            <div className="card bg-gradient-success card-img-holder text-white">
              <div className="card-body">
                <img
                  src={require("../../assets/images/dashboard/circle.svg")}
                  className="card-img-absolute"
                  alt="circle"
                />
                <h4 className="font-weight-normal mb-3">
                  Admin{" "}
                  <i className="mdi mdi-diamond mdi-24px float-right"></i>
                </h4>
                <h2 className="mb-5">{this.state.admins}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;