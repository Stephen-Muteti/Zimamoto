import React, { useState, useEffect, useRef } from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';

export const CustomizedInputBase = ({searchString, setSearchString, placeholder}) => {

  const [searchStr, setSearchStr] = useState('');

  const handleSearchChange = (event) => {
    setSearchStr(event.target.value);
  };  

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchString(searchStr);
  };
  
  const handleSearchBtnSubmit = (event) => {
    setSearchString(searchStr);
  };

  return (
    <Paper
      component="form"
      sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
      onSubmit={handleSearchSubmit}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
        inputProps={{ 'aria-label': 'search google maps' }}
        value={searchStr}
        onChange={handleSearchChange}
      />
      <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
      <IconButton type="button" sx={{ p: '10px' }} aria-label="search" onClick={() => {
          // Call handleSearchSubmit when the search icon is clicked
          handleSearchBtnSubmit();
        }}>
        <SearchIcon />
      </IconButton>
    </Paper>
  );
}