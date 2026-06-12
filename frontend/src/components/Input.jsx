function Input({ type, placeholder, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      style={{
        padding: "10px",
        margin: "10px 0",
        width: "100%",
        borderRadius: "8px",
        border: "1px solid #ccc"
      }}
    />
  );
}

export default Input;