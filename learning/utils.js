METRICS = {};
/**
 * Function to render a set of metrics graphs in the page
 * @param container
 * @param metrics
 */
function initMetrics(container, metrics){
  container = document.getElementById(container);
  for (let i=0; i < metrics.length; i++) {
    let metricDiv = document.createElement("canvas");
    metricDiv.id = "metric_" + metrics[i];
    metricDiv.style.width = "250px";
    metricDiv.style.height = "250px";
    metricDiv.style.display = "inline-block";
    metricDiv.style.marginRight = "10px";
    container.appendChild(metricDiv);

    let ctx = metricDiv.getContext('2d');
    METRICS[metrics[i]] = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            showLine: true,
            label: metrics[i],
            data: [{x: 0, y: 0}],
            fill: false,
            lineTension: 0.5,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 5,
            pointHitRadius: 10,
          }
        ]
      },
      options: {
        legend: {
          display: false
        },
        scales:{
          xAxes: [{
            type: 'linear',
            position: 'bottom',
            ticks: {
              beginAtZero: true
            }
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        },
        title: {
          display: true,
          text: metrics[i]
        },
        responsive: false,
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }
        }
      }
    });
  }
}

/**
 * Function to give a metrics a new value to plot
 * @param name
 * @param value
 */
function setMetric(name, value){
  let chart = METRICS[name];
  let size = chart.data.datasets[0].data.length - 1;

  if (chart.data.datasets[0].data.length > 500){
    chart.data.datasets[0].data = chart.data.datasets[0].data.slice(1, size);
    size -= 1;
  }
  chart.data.datasets[0].data.push({y: value, x: chart.data.datasets[0].data[size].x + 1});
  chart.update();
}

/**
 * Utility function used to duplicate a model.
 * @param instance
 * @param model
 * @returns {*}
 */
function copyTarget(instance, model){
  return tf.tidy(() => {
    newModel = new model(instance.config);

    newModel.buildModel(instance.observation, instance.action);
    const weights = instance.model.weights;
    for (let i=0; i < weights.length; i++){
      newModel.model.weights[i].val.assign(weights[i].val);
    }
    return newModel;
  })
}