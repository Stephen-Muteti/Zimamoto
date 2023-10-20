import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import axios from 'axios';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import { Helmet } from 'react-helmet';

const EditBrigade = () => {
  const { BrigadeID } = useParams();
  const [brigade, setBrigade] = useState({
    operatoremail: '',
    latitude: '',
    longitude: '',
    status: 'role',
    availability: ''
  });
  const [emailError, setEmailError] = useState('');
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [dataLoadError, setDataLoadError] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);

  useEffect(() => {
   setShowProgressBar(true);

   const authToken = localStorage.getItem("access_token");
   axios
     .get(`https://zimamoto-deab7f8718a9.herokuapp.com/get_brigade/${BrigadeID}`,
        {
          headers: {Authorization: `Bearer ${authToken}`,},
        }
      )
     .then((response) => {
       if (response.status === 200 && response.data.brigade) {
       	console.log(response.data.brigade);
         setBrigade(response.data.brigade);
       } else if (response.status === 200) {
         // Brigade not found, handle this case
         setDataLoadError(true);
         setMessage(response.data.error);
       }
     })
     .catch((error) => {
       setDataLoadError(true);
       setMessage('An error occurred while fetching brigade data.');
     })
     .finally(() => {
       setShowProgressBar(false);
     });
 }, [BrigadeID]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setBrigade((prevBrigade) => ({
      ...prevBrigade,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate the form data before submission
    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setShowProgressBar(true);
    setShowSuccessMessage(false);
    setSubmissionError(false);

    await submitBrigade(brigade);

    // Show the success message when the submission is successful
    setShowSuccessMessage(true);
  };


  const submitBrigade = async (data) => {
    try {
      const authToken = localStorage.getItem("access_token");      
      const response = await axios.put(`https://zimamoto-deab7f8718a9.herokuapp.com/zimamoto/update_brigade/${BrigadeID}`, brigade,
        {
          headers: {Authorization: `Bearer ${authToken}`,},
        }
        );

      if (response.status === 200) {
        setShowSuccessMessage(true);
        setMessage(response.data.message);
      }
    } catch (error) {
      handleRequestError(error);
    } finally {
      setShowProgressBar(false);
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

    // Validate Email field
    if (!brigade.operatoremail.trim()) {
      setEmailError('Please enter your email.');
      isValid = false;
    } else if (!isValidEmail(brigade.operatoremail)) {
      setEmailError('Invalid email address.');
      isValid = false;
    } else {
      setEmailError('');
    }

    return isValid;
  };

  const isValidEmail = (email) => {
    // Use a regular expression to validate the email format
    // This is a simple example, you might want to use a more comprehensive regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

	return(
		<div className="main-content user-main-container">
      <Helmet>
		  <title>ZimaMoto | Edit Brigade {BrigadeID}</title>
		</Helmet>
      <SimpleBar className="page-content page-container-scroll">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-4 send-fire-report-form">
              <div className="card card-h-100">
                <div className="card-header justify-content-between d-flex align-items-center">
                  <h4 className="card-title">Edit Brigade</h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>                

                    {dataLoadError ? (
                      <div className="text-danger">
                        {message}
                      </div>
                    ) : (
                    <>

                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <TextField
                            required
                            className="form-control"
                            label="Email"
                            helperText={emailError}
                            id="formrow-email-input"
                            name="OperatorEmail"
                            value={brigade.operatoremail}
                            onChange={handleInputChange}
                            error={emailError ? true : false}
                          />
                        </div>
                      </div>
                    </div>
                    {showProgressBar && (
                      <>
                        <div className="progress-circle-container">
                          <Stack sx={{ color: 'grey.500' }} direction="row">
                            <CircularProgress color="primary" />
                          </Stack>
                        </div>
                      </>
                    )}
                    {(submissionError || showSuccessMessage) && !showProgressBar && (
                      <div className={submissionError ? 'text-danger' : 'text-success'}>
                          {message}
                        </div>
                    )}

                    <div className="mt-4">
                      <button type="submit" className="btn btn-primary w-md">
                        Submit
                      </button>
                    </div>
                    </>
                    )
                  }                  
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SimpleBar>
    </div>
  );
};

export default EditBrigade;