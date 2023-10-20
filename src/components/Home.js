import React, { useState} from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';


const Home = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    latitude: 'unset',
    longitude: 'unset',
  });
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [message, setMessage] = useState('');

  const fetchGeolocation = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const { latitude, longitude } = position.coords;
        setFormData((prevFormData) => ({
          ...prevFormData,
          latitude,
          longitude,
        }));
      } catch (error) {
        console.error('Error getting geolocation:', error);
      }
    }
  };


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setShowProgressBar(true);
    setShowSuccessMessage(false);
    setSubmissionError(false);

    await fetchGeolocation();
    await submitFormData(formData);
  };

  const submitFormData = async (data) => {    
    try {
      const response = await axios.post('https://zimamoto-deab7f8718a9.herokuapp.com/zimamoto/report', data);

      if (response.status === 200) {
        setMessage(response.data.message);
      }
    } catch (error) {
      handleRequestError(error);     
    }finally {
      setShowProgressBar(false);
      setShowSuccessMessage(true);      
    }
  };


  const handleRequestError = (error) => {
    setSubmissionError(true);
    let message = 'An error occurred while processing your request';
    if (error.response) {
      message = `Error ${error.response.status} : ${error.response.data.error}`;
    } else if (error.request) {
      message = 'Server is unreachable. Try again later';
    }
    setMessage(message);
  };


  const validateForm = () => {
    let isValid = true;

    if (!formData.name.trim()) {
      setNameError('Please enter your name.');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!formData.phone.trim()) {
      setPhoneNumberError('Please enter your phone number.');
      isValid = false;
    } else if (!/^0|254\d{9}$/.test(formData.phone)) {
      setPhoneNumberError('Invalid phone number. Please enter a valid Kenyan phone number starting with 0 or 254.');
      isValid = false;
    } else {
      setPhoneNumberError('');
    }

    return isValid;
  };

  return (
    <div className="main-content user-main-container">
      <Helmet>
        <title>ZimaMoto | Home</title>
      </Helmet>
      <SimpleBar className="page-content page-container-scroll">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-3 send-fire-report-form">
              <div className="card card-h-100">
                <div className="card-header justify-content-between d-flex align-items-center">
                  <h4 className="card-title">Report a Fire Incident</h4>
                </div>
                <div className="card-body">
                  <div className="">
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <TextField
                              required
                              id="formrow-firstname-input"
                              className="form-control"
                              label="Name"
                              helperText={nameError}
                              value={formData.name}
                              onChange={handleInputChange}
                              name="name"
                              error={!!nameError}
                            />
                          </div>
                        </div>

                        <div className="col-md-12">
                          <div className="mb-3">
                            <TextField
                              required
                              className="form-control"
                              label="Phone Number"
                              helperText={phoneNumberError}
                              id="formrow-phone-input"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              error={!!phoneNumberError}
                            />
                          </div>
                        </div>
                      </div>

                      {showProgressBar && (
                        <div className="progress-circle-container">
                          <Stack sx={{ color: 'grey.500' }} direction="row">
                            <CircularProgress color="primary" />
                          </Stack>
                        </div>
                      )}

                      {showSuccessMessage && (
                        <div className={`form-submission-message ${submissionError ? 'text-danger' : 'text-success'}`}>
                          {message}
                        </div>
                      )}
                      <div className="mt-4 submit-btn-container">
                        <button type="submit" className="btn btn-primary w-md">
                          Submit
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SimpleBar>
    </div>
  );
};

export default Home;