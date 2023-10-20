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

const EditUser = () => {
  const { userId } = useParams();
  const [user, setUser] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'role'
  });

  const [roleError, setRoleError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [dataLoadError, setDataLoadError] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState('');

  useEffect(() => {
      setShowProgressBar(true);

      const authToken = localStorage.getItem("access_token");

      axios
        .get(`https://zimamoto-deab7f8718a9.herokuapp.com/get_user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
        )
        .then((response) => {
          if (response.status === 200 && response.data.user) {
            setUser(response.data.user);
          } else if(response.status === 200) {
            // User not found, handle this case
            setDataLoadError(true);
            setMessage(response.data.error);
          }
        })
        .catch((error) => {
          setDataLoadError(true);
          setMessage('An error occurred while fetching user data.');
        })
        .finally(() => {
          setShowProgressBar(false);
        });
    }, [userId]);

  const handleRoleChange = (selectedValue) => {
    user['role'] = selectedValue;
  };


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUser(prevUser => ({
      ...prevUser,
      [name]: value
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

    await submitUser(user);

    // Show the success message when the submission is successful
    setShowSuccessMessage(true);
  };


  const submitUser = async (data) => {
    try {
      const authToken = localStorage.getItem("access_token");
      
      const response = await axios.put(`https://zimamoto-deab7f8718a9.herokuapp.com/update_user/${userId}`, user,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
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

    // Validate Name field
    if (!user.name.trim()) {
      setNameError('Please enter your name.');
      isValid = false;
    } else {
      setNameError('');
    }

    // Validate Phone Number field
    if (!user.phone.trim()) {
      setPhoneNumberError('Please enter your phone number.');
      isValid = false;
    } else if (!/^0|254\d{9}$/.test(user.phone)) {
      setPhoneNumberError('Invalid phone number. Please enter a valid Kenyan phone number starting with 0 or 254.');
      isValid = false;
    } else {
      setPhoneNumberError('');
    }

    // Validate Email field
    if (!user.email.trim()) {
      setEmailError('Please enter your email.');
      isValid = false;
    } else if (!isValidEmail(user.email)) {
      setEmailError('Invalid email address.');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (user.role.toLowerCase() === 'role') {
      setRoleError('Please select a role');
      isValid = false;
    } else {
      setRoleError('');
    }

    return isValid;
  };

  const isValidEmail = (email) => {
    // Use a regular expression to validate the email format
    // This is a simple example, you might want to use a more comprehensive regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const roles = [
    { display: 'Role', value: 'role' },
    { display: 'Administrator', value: 'administrator' },
    { display: 'Staff', value: 'staff' },
    { display: 'Operator', value: 'operator' },
  ];

  return (
    <div className="main-content user-main-container">
      <Helmet>
        <title>ZimaMoto | Edit User {userId}</title>
      </Helmet>
      <SimpleBar className="page-content page-container-scroll">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-6 send-fire-report-form">
              <div className="card card-h-100">
                <div className="card-header justify-content-between d-flex align-items-center">
                  <h4 className="card-title">Edit User</h4>
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
                      <div className="col-md-6">
                        <div className="mb-3">
                          <TextField
                            required
                            id="formrow-firstname-input"
                            className="form-control"
                            label="Name"
                            helperText={nameError}
                            value={user.name}
                            onChange={handleInputChange}
                            name="name"
                            error={nameError ? true : false}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <TextField
                            required
                            className="form-control"
                            label="Phone Number"
                            helperText={phoneNumberError}
                            id="formrow-phone-input"
                            name="phone"
                            value={user.phone}
                            onChange={handleInputChange}
                            error={phoneNumberError ? true : false}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <TextField
                            required
                            className="form-control"
                            label="Email"
                            helperText={emailError}
                            id="formrow-email-input"
                            name="email"
                            value={user.email}
                            onChange={handleInputChange}
                            error={emailError ? true : false}
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        {user.name && ( // Conditionally render the CustomDropDown component when user data is available
                          <div className="mb-3 select-role-container">
                            {/* Pass the user prop to the CustomDropDown component */}
                            <CustomDropDown
                              options={roles}
                              onRoleChange={handleRoleChange} // Update user role in parent component
                              roleError={roleError}
                              user={user} // Pass the user prop
                            />
                          </div>
                        )}
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

export default EditUser;

export const CustomDropDown = ({ options, onRoleChange, roleError, user }) => {
  const [selectedOption, setSelectedOption] = React.useState('Role');

  useEffect(() => {
    // Set the initial selectedOption based on the user's role
    if (user && user.role) {
      const selectedOptionData = options.find((option) => option.value === user.role);
      const selectedOptionDisplay = selectedOptionData ? selectedOptionData.display : '';
      setSelectedOption(selectedOptionDisplay);
    }
  }, [user]);

  const handleChange = (event) => {
    const newCategory = event.target.value;

    const selectedValue = options.find((option) => option.display.toLowerCase() === newCategory.toLowerCase())?.value;

    setSelectedOption(newCategory);
    onRoleChange(selectedValue);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
      <InputLabel id="demo-select-small-label">Select Role</InputLabel>
      <Select
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={selectedOption}
        label="Select Category"
        onChange={handleChange}
        error={roleError ? true : false}
      >
        {options.map((option) => (
          <MenuItem key={option.display} value={option.display}>
            {option.display}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
