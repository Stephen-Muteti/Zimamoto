import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import socketIOClient from 'socket.io-client';

ChartJS.register(ArcElement, Tooltip, Legend);

const BrigadesAvailabilityCategoryChart = () => {
  const [data, setData] = useState({
    labels: ['Engaged', 'Free', 'Under Maintenance'],
    datasets: [
      {
        label: 'Number ',
        data: [],
                backgroundColor: [
                'rgba(169, 169, 169, 0.5)',
                'rgba(128, 128, 128, 0.5)',
                'rgba(192, 192, 192, 0.5)',
                ],
                borderColor: [
                'rgba(169, 169, 169, 0.2)',
                'rgba(128, 128, 128, 0.2)',
                'rgba(192, 192, 192, 0.2)',
                ],
        borderWidth: 1,
      },
    ],
  });

  const [message, setMessage] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);
  const [dataFetchError, setDataFetchError] = useState(false);


  const getBrigades = () => {
    const authToken = localStorage.getItem("access_token");

    axios.get('https://zimamoto-deab7f8718a9.herokuapp.com/get_brigade_categories',
        {
          headers: {Authorization: `Bearer ${authToken}`,},
        }
      )
      .then(response => {
        if(response.status === 200){
            const userCategoryData = response.data;
            setData(prevData => ({
              ...prevData,
              datasets: [{
                ...prevData.datasets[0],
                data: [
                  userCategoryData.engaged, 
                  userCategoryData.free,
                  userCategoryData.maintenance,
                  ]
              }]
            }));         
        }
      })
      .catch(error => {
        handleRequestError(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }


  useEffect(() => {
    getBrigades();
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


  useEffect(() => {
    const newSocket = socketIOClient('https://zimamoto-deab7f8718a9.herokuapp.com');

    newSocket.on('brigade_availability_update', ({ operatorEmail, availability }) => {
      getBrigades();
    });

    
    return () => {
      newSocket.close();
    };
  }, []);


  return (
    <div className="col-xl-4">
      <div className="card card-h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between">
            <h4 className="card-title mb-4">Brigade Availability</h4>
          </div>
          {isLoading ? (
            <div className="text-center">
              <CircularProgress color="primary" />
            </div>
          ) : dataFetchError ? (
            <div className="text-center text-danger">
              {message}
            </div>
          ) : (
            <Doughnut data={data} />
          )}
        </div>
      </div>
    </div>
  );
}

export default BrigadesAvailabilityCategoryChart;
