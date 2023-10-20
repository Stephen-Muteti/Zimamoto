import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import socketIOClient from 'socket.io-client';

ChartJS.register(ArcElement, Tooltip, Legend);

const BrigadesStatusCategoryChart = () => {
  const [data, setData] = useState({
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        label: 'Number',
        data: [],
        backgroundColor: ['rgba(119, 158, 203, 0.5)', 'rgba(79, 129, 189, 0.5)'],
        borderColor: ['rgba(119, 158, 203, 0.2)', 'rgba(79, 129, 189, 0.2)'],
        borderWidth: 1,
      },
    ],
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetchError, setDataFetchError] = useState(false);
  const [websocketRegistered, setWebsocketRegistered] = useState(false);

  // Use a useRef to keep track of totalBrigades
  const totalBrigadesRef = useRef(0);

  const fetchData = () => {
    const authToken = localStorage.getItem('access_token');

    axios
      .get('https://zimamoto-deab7f8718a9.herokuapp.com/get_brigade_categories', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((response) => {
        if (response.status === 200) {
          const userCategoryData = response.data;
          totalBrigadesRef.current = userCategoryData.total; // Update totalBrigades using ref
          setData((prevData) => ({
            ...prevData,
            datasets: [
              {
                ...prevData.datasets[0],
                data: [userCategoryData.active, userCategoryData.inactive],
              },
            ],
          }));
        }
      })
      .catch((error) => {
        handleRequestError(error);
      })
      .finally(() => {
        setIsLoading(false);
        setWebsocketRegistered(true);       
        
      });
  };

  useEffect(() => {
    fetchData();
  }, []);


  useEffect(() => {
    const newSocket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

        newSocket.on('brigade_state_update', (updateData) => {
          if (updateData) {
            const currTotalBrigades = totalBrigadesRef.current;
            fetchData();

            // setData((prevData) => ({
            //   ...prevData,
            //   datasets: [
            //     {
            //       ...prevData.datasets[0],
            //       data: [
            //         Math.min(Math.max(parseInt(prevData.datasets[0].data[0]) + parseInt(updateData.activeChange), 0), currTotalBrigades),
            //         Math.min(Math.max(parseInt(prevData.datasets[0].data[1]) + parseInt(updateData.inactiveChange), 0), currTotalBrigades),
            //       ],
            //     },
            //   ],
            // }));
          }
        });

        return () => {
          newSocket.close();
        };
  }, []);

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

  return (
    <div className="col-xl-4">
      <div className="card card-h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between">
            <h4 className="card-title mb-4">Brigade Status</h4>
          </div>
          {isLoading ? (
            <div className="text-center">
              <CircularProgress color="primary" />
            </div>
          ) : dataFetchError ? (
            <div className="text-center text-danger">{message}</div>
          ) : (
            <Doughnut data={data} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BrigadesStatusCategoryChart;