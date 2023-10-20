import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import socketIOClient from 'socket.io-client';
import CircularProgress from '@mui/material/CircularProgress';
import {CustomDropDown} from './CustomCategorySelection.js';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
};

const timeRangeOptions = [
  { display: '1 Year', value: '1 year' },
  { display: '1 Week', value: '1 week' },
];

const FireReportsChart = () => {
  const [timeRange, setTimeRange] = useState('1 year');
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        backgroundColor: 'rgba(119, 158, 203, 0.5)',
      },
    ],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dataFetchError, setDataFetchError] = useState(false);
  const [message, setMessage] = useState('');

  const updateLabels = (timeRange) => {
    let labels = [];

    if (timeRange === '1 year') {
      const currentDate = new Date();
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        labels.unshift(date.toLocaleString('default', { month: 'long' }));
      }
    } else if (timeRange === '1 week') {
      const currentDate = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        labels.unshift(date.toLocaleDateString('default', { weekday: 'long' }));
      }
    }

    return labels;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const authToken = localStorage.getItem('access_token');
      const response = await fetch(
        `https://zimamoto-deab7f8718a9.herokuapp.com/zimamoto/fire-reports?time_range=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const data = await response.json();

      if (response.status === 200) {
        setChartData({
          labels: data.labels,
          datasets: [
            {
              label: '',
              data: data.values,
              backgroundColor: 'rgba(119, 158, 203, 0.5)',
            },
          ],
        });
      } else {
        handleRequestError(response);
      }
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  useEffect(() => {
    const socket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

    socket.on('fire_update', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [timeRange]);

  useEffect(() => {
    const newLabels = updateLabels(timeRange);
    setChartData((prevChartData) => ({
      ...prevChartData,
      labels: newLabels,
    }));
  }, [timeRange]);

  const handleRequestError = (error) => {
    setDataFetchError(true);
    let message = 'An error occurred while processing your request';
    if (error.response) {
      message = `Error ${error.response.status} : ${error.response.data.error}`;
    } else if (error.request) {
      message = 'Server is unreachable. Try again later';
    }
    setMessage(message);
  };

  const handleCategoryChange = (newTimeRange) => {
    setTimeRange(newTimeRange);
  };

  return (
    <div className="col-xl-8">
      <div className="card card-h-100">
        <div className="card-body">
          <div className="row users-table-top">
            <div className="col-xl-6">
              <h4 className="card-title mb-4">Fire Reports Chart</h4>
            </div>             

            <div className="col-xl-4 search-users-select-cat-container">
              <CustomDropDown
                options={timeRangeOptions}
                onCategoryChange={handleCategoryChange}
                selectedParentValue = {'1 Year'}
                title={'Select Category'}                
              />
            </div>
          </div>
          <SimpleBar>
            {isLoading ? (
              <div className="text-center">
                <CircularProgress color="primary" />
              </div>
            ) : dataFetchError ? (
              <div className="text-center text-danger">
                {message}
              </div>
            ) : (
              <Bar options={options} data={chartData} />
            )}
          </SimpleBar>
        </div>
      </div>
    </div>
  );
};

export default FireReportsChart;

