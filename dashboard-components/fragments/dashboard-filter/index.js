if (!fragmentNamespace)
  // If it is not set then we are in fragment editor
  return;

if (document.body.classList.contains('has-edit-mode-menu'))
  // If present then we are in content page editor
  return;

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

if (configuration) {
  const defaultMaxEntires = configuration.maxEntries
    ? configuration.maxEntires
    : 7;
  const defaultStartDate = configuration.startDate
    ? new Date(configuration.startDate)
    : new Date();
  const defaultEndDate = configuration.endDate
    ? new Date(configuration.endDate)
    : defaultStartDate.addDays(defaultMaxEntires);
  const defaultStepsTarget = configuration.stepsTarget
    ? configuration.stepsTarget
    : 10000;
  const defaultPubSubTopic = configuration.pubsubTopic
    ? configuration.pubsubTopic
    : 'healthcare-example';

  const startDateEl = document.querySelector(
    `#${fragmentNamespace}_startDate`,
    fragmentElement
  );
  if (startDateEl) {
    startDateEl.valueAsDate = defaultStartDate;
  }
  const endDateEl = document.querySelector(
    `#${fragmentNamespace}_endDate`,
    fragmentElement
  );
  if (endDateEl) {
    endDateEl.valueAsDate = defaultEndDate;
  }

  const maxEntriesEl = document.querySelector(
    `#${fragmentNamespace}_maxEntries`,
    fragmentElement
  );
  if (maxEntriesEl) {
    maxEntriesEl.value = defaultMaxEntires;
  }

  const targetStepsEl = document.querySelector(
    `#${fragmentNamespace}_targetSteps`,
    fragmentElement
  );
  if (targetStepsEl) {
    targetStepsEl.value = defaultStepsTarget;
  }

  document.addEventListener('DOMContentLoaded', function (event) {
    const refreshDashboard = (e) => {
      const dashboard = document.querySelector('#healthcare-dashboard');

      var charts;
      if (dashboard) {
        charts = document.querySelectorAll('healthcare-component', dashboard);
      } else {
        console.warn('Unable to find dashboard, search full DOM');
        charts = document.querySelectorAll('healthcare-component');
      }

      if (!charts) {
        console.warn('Unable to find the healthcare components');
      }

      charts.forEach((chart) => {
        if (startDateEl) {
          const val = startDateEl.value;
          chart.setAttribute('startdate', val);
        }

        if (endDateEl) {
          const val = endDateEl.value;
          chart.setAttribute('enddate', val);
        }

        if (maxEntriesEl) {
          const val = maxEntriesEl.value;
          chart.setAttribute('maxentries', val);
        }

        if (targetStepsEl) {
          const val = targetStepsEl.value;
          chart.setAttribute('targetsteps', val);
        }
      });
    };

    const refreshDashboardBtn = document.querySelector(
      `#${fragmentNamespace}_refreshDashboard`,
      fragmentElement
    );
    if (refreshDashboardBtn && refreshDashboard) {
      refreshDashboardBtn.addEventListener('click', refreshDashboard);
    }

    const randomIntFromInterval = (min, max) => {
      return Math.floor(randomFloatFromInterval(min, max));
    };

    const randomFloatFromInterval = (min, max) => {
      return Math.random() * (max - min + 1) + min;
    };

    const getSync = (path) => {
      const request = new XMLHttpRequest();
      request.open('GET', path, false);
      request.setRequestHeader('x-csrf-token', Liferay.authToken);
      request.setRequestHeader('Content-Type', 'application/json');
      request.send(null);

      if (request.status === 200) {
        return JSON.parse(request.responseText);
      }
      return {};
    };

    const submitData = (path, data) => {
      return fetch(path, {
        method: 'POST',
        headers: {
          'x-csrf-token': Liferay.authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Success:', data);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    };

    const getLastHeartRate = (userId) => {
      const lastReading = getSync(
        `/o/c/heartrates?filter=r_heartRate_userId%20eq%20%27${userId}%27&page=1&pageSize=1&sort=readingDate%3Adesc`
      );
      if (lastReading && lastReading.items) {
        const { lowest, highest } = lastReading.items[0];
        return { lowest, highest };
      }
      return { lowest: 0, hightest: 0 };
    };

    const generateHeartRateData = (userId, readingDate, previousHeartRate) => {
      const lowest = randomIntFromInterval(
        previousHeartRate.lowest * 0.95,
        previousHeartRate.lowest * 1.05
      );
      const highest = randomIntFromInterval(
        previousHeartRate.highest * 0.95,
        previousHeartRate.highest * 1.05
      );
      return {
        readingDate,
        lowest,
        highest,
        r_heartRate_userId: userId,
      };
    };

    const getLastBloodPressure = (userId) => {
      const lastReading = getSync(
        `/o/c/bloodpressures?filter=r_bloodPressure_userId%20eq%20%27${userId}%27&page=1&pageSize=1&sort=readingDate%3Adesc`
      );
      if (lastReading && lastReading.items) {
        const { diastolic, systolic } = lastReading.items[0];
        return { diastolic, systolic };
      }
      return { diastolic: 0, systolic: 0 };
    };

    const generateBloodPressureData = (
      userId,
      readingDate,
      previousBloodPressure
    ) => {
      const diastolic = randomIntFromInterval(
        previousBloodPressure.diastolic * 0.9,
        previousBloodPressure.diastolic * 1.1
      );
      const systolic = randomIntFromInterval(
        previousBloodPressure.systolic * 0.9,
        previousBloodPressure.systolic * 1.1
      );
      return {
        readingDate,
        diastolic,
        systolic,
        r_bloodPressure_userId: userId,
      };
    };

    const getLastStepsCount = (userId) => {
      const lastReading = getSync(
        `/o/c/stepses?filter=r_steps_userId%20eq%20%27${userId}%27&page=1&pageSize=1&sort=readingDate%3Adesc`
      );
      if (lastReading && lastReading.items) {
        const { stepCount } = lastReading.items[0];
        return stepCount;
      }
      return 0;
    };

    const generateStepsData = (userId, readingDate, previousStepCount) => {
      const stepCount = randomIntFromInterval(
        previousStepCount * 0.6,
        previousStepCount * 1.4
      );
      return {
        readingDate,
        stepCount,
        r_steps_userId: userId,
      };
    };

    const getLastWeight = (userId) => {
      const lastReading = getSync(
        `/o/c/weights?filter=r_weight_userId%20eq%20%27${userId}%27&page=1&pageSize=1&sort=readingDate%3Adesc`
      );
      if (lastReading && lastReading.items) {
        const { weight } = lastReading.items[0];
        return weight;
      }
      return 0;
    };

    const generateWeightData = (userId, readingDate, previousWeight) => {
      const weight = randomFloatFromInterval(
        previousWeight * 0.97,
        previousWeight * 1.03
      );
      return {
        readingDate,
        weight: Math.round((weight + Number.EPSILON) * 10) / 10,
        r_weight_userId: userId,
      };
    };

    const syncData = (e) => {
      const startDate = new Date(startDateEl.value);
      const endDate = new Date(endDateEl.value);
      var heartRateData = [];
      var bloodPressureData = [];
      var stepsData = [];
      var weightData = [];
      const userId = Liferay.ThemeDisplay.getUserId();
      var lastHeartRate = getLastHeartRate(userId);
      var lastBloodPressure = getLastBloodPressure(userId);
      var lastStepsCount = getLastStepsCount(userId);
      var lastWeight = getLastWeight(userId);

      for (
        var curDate = startDate;
        curDate <= endDate;
        curDate.setDate(curDate.getDate() + 1)
      ) {
        const heartRate = generateHeartRateData(
          userId,
          new Date(curDate.valueOf()),
          lastHeartRate
        );
        heartRateData.push(heartRate);
        const { lowest, highest } = heartRate;
        lastHeartRate = { lowest, highest };
        const bloodPressure = generateBloodPressureData(
          userId,
          new Date(curDate.valueOf()),
          lastBloodPressure
        );
        bloodPressureData.push(bloodPressure);
        const { diastolic, systolic } = bloodPressure;
        lastBloodPressure = { diastolic, systolic };
        const steps = generateStepsData(
          userId,
          new Date(curDate.valueOf()),
          lastStepsCount
        );
        stepsData.push(steps);
        lastStepsCount = steps.stepCount;
        const weight = generateWeightData(
          userId,
          new Date(curDate.valueOf()),
          lastWeight
        );
        weightData.push(weight);
        lastWeight = weight.weight;
      }

      if (heartRateData) {
        submitData('/o/c/heartrates/batch', heartRateData).then(() => {
          submitData('/o/c/bloodpressures/batch', bloodPressureData).then(
            () => {
              submitData('/o/c/stepses/batch', stepsData).then(() => {
                submitData('/o/c/weights/batch', weightData).then(() => {
                  if (!PubSub) {
                    console.warn('PubSub is not available');
                    return;
                  } else if (!defaultPubSubTopic) {
                    console.warn('The PubSub topic has not been set');
                    return;
                  }
                  const msg = {
                    refresh: true,
                  };
                  var token = PubSub.publish(defaultPubSubTopic, msg);
                  console.log('PubSub token', token);
                });
              });
            }
          );
        });
      }
    };

    const syncDataBtn = document.querySelector(
      `#${fragmentNamespace}_syncData`,
      fragmentElement
    );
    if (syncDataBtn && syncData) {
      syncDataBtn.addEventListener('click', syncData);
    }
  });
}
