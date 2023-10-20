import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';

const AddBrigade = () => {
	const [formData, setFormData] = useState({
	    operatorEmail: '',
	  });

  	const [emailError, setEmailError] = useState('');
	  const [showProgressBar, setShowProgressBar] = useState(false);
	  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	  const [message, setMessage] = useState('');
	  const [submissionError, setSubmissionError] = useState(false);
	  const [searchTerm, setSearchTerm] = useState('');
		const [searchResults, setSearchResults] = useState([]);

  	const handleSubmit = async (event) => {
	    event.preventDefault();
	    const isValid = validateForm();

	    if (!isValid) {
	      return;
	    }    

	    await submitFormData(formData);
	  };


	  const submitFormData = async (data) => {
	  	setShowProgressBar(true);
	    setShowSuccessMessage(false);
	    setSubmissionError(false);
	    try {
	    	const authToken = localStorage.getItem("access_token");
	      const response = await axios.post('https://zimamoto-deab7f8718a9.herokuapp.com/add_brigade', formData,
	      	{
	          headers: {Authorization: `Bearer ${authToken}`,},
	        }
	      	);

	      if (response.status === 200) {
	        setShowProgressBar(false);
	        setMessage(response.data.message);  
	      }
	    } catch (error) {
	      handleRequestError(error);
	    } finally {
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


	  const handleInputChange = (event) => {
	    const { name, value } = event.target;
	    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
	  };

	  const validateForm = () => {
	  	let isValid = true;
	    if (!formData.operatorEmail.trim()) {
	      setEmailError('Please enter your email.');
	      isValid = false;
	    } else if (!isValidEmail(formData.operatorEmail)) {
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
	        <title>ZimaMoto | Add brigade</title>
	      </Helmet>
	      <SimpleBar className="page-content page-container-scroll">
	        <div className="container-fluid">
	          <div className="row">
	            <div className="col-xl-3 send-fire-report-form">
	              <div className="card card-h-100">
	                <div className="card-header justify-content-between d-flex align-items-center">
	                  <h4 className="card-title">Add Brigade</h4>
	                </div>
	                <div className="card-body">
	                  <form onSubmit={handleSubmit}>
	                    <div className="row">
				      	</div>
	                    <div className="row">					      
	                      <div className="col-md-12">
	                        <div className="mb-3">
	                          <TextField
	                            required
	                            className="form-control"
	                            label="Operator Email"
	                            helperText={emailError}
	                            id="formrow-email-input"
	                            name="operatorEmail"
	                            value={formData.operatorEmail}
	                            onChange={handleInputChange}
	                            error={emailError ? true : false}
	                          />
	                        </div>
	                      </div>
	                      </div>
	                      {/* Display the progress circle */}
		                    {showProgressBar && (
		                      <>
		                        <div className="progress-circle-container">
		                          <Stack sx={{ color: 'grey.500' }} direction="row">
		                            <CircularProgress color="primary" />
		                          </Stack>
		                        </div>
		                      </>
		                    )}

		                    {/* Display the success message */}
		                    {showSuccessMessage && (
		                      <div className={`form-submission-message ${submissionError ? 'text-danger' : 'text-success'}`}>
		                        {message}
		                      </div>
		                    )}
		                    <div className="mt-4 add-brigade-sub-btn">
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
      </SimpleBar>
    </div>
		);
}

export default AddBrigade;