import React from 'react';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';

export const CustomDropDown = ({ options, onCategoryChange, selectedParentValue, title }) => {
  const [selectedOption, setSelectedOption] = React.useState(selectedParentValue);

  const handleChange = (event) => {
    const newCategory = event.target.value;

    // Find the corresponding value based on the selected option
    const selectedValue = options.find((option) => option.display.toLowerCase() === newCategory.toLowerCase())?.value;

    setSelectedOption(newCategory);

    // Call the callback function to update the selected category value
    onCategoryChange(selectedValue);
  };


  return (
    <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
      <InputLabel id="demo-select-small-label">{title}</InputLabel>
      <Select
        labelId="demo-select-small-label"
        id="demo-select-small"
        value={selectedOption}
        label={title}
        onChange={handleChange}
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