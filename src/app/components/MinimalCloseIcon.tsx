import { Box } from '@mui/material';

export function MinimalCloseIcon(props: React.ComponentProps<typeof Box>) {
  return (
    <Box
      {...props}
      sx={{
        width: '2.4rem',
        height: '2.4rem',
        position: 'relative',
        ...props.sx,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '0',
          width: '100%',
          height: '1px',
          backgroundColor: 'currentColor',
          transform: 'translateY(-50%) rotate(45deg)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '0',
          width: '100%',
          height: '1px',
          backgroundColor: 'currentColor',
          transform: 'translateY(-50%) rotate(-45deg)',
        }}
      />
    </Box>
  );
}
