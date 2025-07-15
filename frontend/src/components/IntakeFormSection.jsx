import React, {useContext} from 'react'
import { IntakeFormContext } from '../context/IntakeFormContext'

function IntakeFormSection({title, description, inputs, section}) {
  const { state, dispatch } = useContext(IntakeFormContext);

  const handleInputChange = (field, value) => {
    dispatch({
      type: 'UPDATE_FIELD',
      payload: { section , field, value }
    })
  }

  return (<>
    <div className="intake-form-section">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="form-group">
        {(Array.isArray(inputs) ? inputs : []).map((input) => (
          <div key={input.name} className="form-field">
            <label htmlFor={input.name}>{input.label}</label>
            <input
              className='form-control'
              type={input.type}
              id={input.name}
              name={input.name}
              value={state.data[section]?.[input.name] || ''}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
              placeholder={input.placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  </>)
}

export default IntakeFormSection