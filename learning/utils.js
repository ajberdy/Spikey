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
    chart.data.datasets[0].data.shift();
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
function copyModel(instance, model){
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


/**
 * Used for building subsets of input data to feed into model
 * @param idxList
 * @returns {function(*, *=, *): boolean}
 */
function idxFilter(idxList){
  return function(value, index, array){
    return idxList.indexOf(index) != 1;
  }
}

/**
 * Flattens an observation that is a list of x,y,z,curr_len objects into a tensor for input
 * @param observation
 * @returns {*}
 */
function flattenToTensor(observation){
  let flattened = [];
  for(let i=0; i<observation.length; i++){
    flattened.push(observation[i].x);
    flattened.push(observation[i].y);
    flattened.push(observation[i].z);
    if(i != observation.length-1){
      flattened.push(observation[i].current);
    }
  }
  return tf.tensor1d(flattened);
}

/**
 * Logs memory usage
 */
function logTfMemory(){
  let mem = tf.memory();
  console.log("numBytes:" + mem.numBytes +
    "\nnumBytesInGPU:" + mem.numBytesInGPU +
    "\nnumDataBuffers:" + mem.numDataBuffers +
    "\nnumTensors:" + mem.numTensors);
}
/**
 * Updates a target model with the original model's weights multiplied by 1-tau
 * @param target
 * @param original
 * @param config
 * @returns {*}
 */
function targetUpdate(target, original, config){
    return tf.tidy(() => {
        const originalW = original.model.trainableWeights;
        const targetW = target.model.trainableWeights;

        const one = tf.scalar(1);
        const tau = tf.scalar(config.tau);

        for (let m=0; m < originalW.length; m++){
            const lastValue = target.model.trainableWeights[m].val.clone();
            let nValue = tau.mul(originalW[m].val).add(targetW[m].val.mul(one.sub(tau)));
            target.model.trainableWeights[m].val.assign(nValue);
            const diff = lastValue.sub(target.model.trainableWeights[m].val).mean().buffer().values;
            if (diff[0] == 0){
                console.warn("targetUpdate: Nothing has been changed!")
            }
        }
    });
}

/**
 * Copies a model into noisyModel and adds perturbed weights based on some standard deviation.
 * @param model
 * @param noisyModel
 * @param stdDev
 * @param seed
 * @returns {*}
 */
function addNoise(model, noisyModel, stdDev, seed){
  return tf.tidy(() => {
    const weights = model.model.trainableWeights;
    for (let i=0; i < weights.length; i++){
      let shape = noisyModel.model.trainableWeights[i].val.shape;
      // console.log(stdDev);
      let randomTensor = tf.randomNormal(shape, 0, stdDev, "float32", seed);
      // randomTensor.print();
      let newValue = weights[i].val.add(randomTensor);
      // console.log("newValue:");
      // newValue.print();
      noisyModel.model.trainableWeights[i].val.assign(newValue);
      randomTensor.dispose();
    }
  })
}


function mean(numbers) {
    var total = 0, i;
    for (i = 0; i < numbers.length; i += 1) {
        total += numbers[i];
    }
    return total / numbers.length;
}

/**
 * Downloads an object to the downloads folder
 * @param content
 * @param fileName
 * @param contentType
 */
function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([JSON.stringify(content)], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

const AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();

function playSound(buffer) {
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
}